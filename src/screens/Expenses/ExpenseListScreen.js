/**
 * ExpenseListScreen
 *
 * Expense management hub nested inside the More stack. Lists all
 * expenses with a summary card (total + count).
 *
 * Data comes from the real backend endpoint:
 *   GET /expense/getAll   (ExpenseController.getAllExpenses)
 * which returns every expense with an optional embedded animal.
 */
import React, { useCallback, useLayoutEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import AppCard from '../../components/AppCard';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { EXPENSE_ROUTES } from '../../navigation/routes';
import { getExpenseTypeLabel } from '../../constants/expenseEnums';

const TYPE_ACCENTS = {
  FEED: colors.warning,
  MEDICINE: colors.info,
  MISC: colors.textSecondary,
};

const AddHeaderButton = ({ onPress }) => (
  <Pressable onPress={onPress} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>➕</Text>
  </Pressable>
);

const ExpenseListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get('/expense/getAll');
      const list = Array.isArray(response) ? response : [];
      list.sort((a, b) =>
        String(b.expenseDate || '').localeCompare(String(a.expenseDate || '')),
      );
      setExpenses(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses]),
  );

  const openAdd = useCallback(() => {
    navigation.navigate(EXPENSE_ROUTES.ADD);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <AddHeaderButton onPress={openAdd} />,
    });
  }, [navigation, openAdd]);

  const totalAmount = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );

  if (loading && expenses.length === 0) {
    return <Loading message="Loading expenses..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load expenses"
        message={error.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={loadExpenses}
      />
    );
  }

  const renderItem = ({ item }) => {
    const typeLabel = getExpenseTypeLabel(item.type);
    const accent = TYPE_ACCENTS[item.type] || colors.textSecondary;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${typeLabel} expense details`}
        onPress={() =>
          navigation.navigate(EXPENSE_ROUTES.DETAILS, { expenseId: item.id })
        }
      >
        <AppCard style={styles.listRow}>
          <View style={[styles.typeBadge, { backgroundColor: `${accent}1A` }]}>
            <Text style={[styles.typeBadgeText, { color: accent }]}>
              {typeLabel}
            </Text>
          </View>

          <View style={styles.rowInfo}>
            <Text style={styles.rowDate}>
              {formatDateString(item.expenseDate) || '—'}
            </Text>
            {item.animal ? (
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.animal.name || 'Animal'} #{item.animal.id}
              </Text>
            ) : (
              <Text style={styles.rowMeta}>General expense</Text>
            )}
            {item.notes ? (
              <Text style={styles.rowNotes} numberOfLines={1}>
                {item.notes}
              </Text>
            ) : null}
          </View>

          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.chevron}>›</Text>
        </AppCard>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Records</Text>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
          </View>
        </AppCard>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No expenses yet"
            message="Add an expense (feed, medicine, miscellaneous) to see it here."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
  },
  summaryBlock: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs / 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
    maxWidth: 110,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  rowInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  rowMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  rowNotes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default ExpenseListScreen;
