import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import AppCard from '../../components/AppCard';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import TappablePhoto from '../../components/TappablePhoto';
import colors from '../../constants/colors';
import {
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../constants/appConstants';
import { getExpenseTypeLabel } from '../../constants/expenseEnums';
import { formatDateString } from '../../utils/date';
import { formatCurrency } from '../../utils/format';

const ViewExpenseDetailsScreen = ({ route }) => {
  const expenseId = route.params?.expenseId;
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          if (expenseId == null) {
            throw new Error('No expense was selected.');
          }
          // The backend currently exposes getAll, not a get-by-id endpoint.
          const response = await get('/expense/getAll');
          const found = Array.isArray(response)
            ? response.find(item => String(item.id) === String(expenseId))
            : null;
          if (!found) {
            throw new Error('This expense could not be found.');
          }
          if (active) {
            setExpense(found);
          }
        } catch (err) {
          if (active) {
            setError(err);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };
      load();
      return () => {
        active = false;
      };
    // Changing the retry counter intentionally re-runs the focused request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenseId, reloadKey]),
  );

  if (loading) {
    return <Loading message="Loading expense..." />;
  }
  if (error || !expense) {
    return (
      <EmptyState
        icon="🧾"
        title="Couldn't load expense"
        message={error?.message}
        actionLabel="Retry"
        onActionPress={() => setReloadKey(key => key + 1)}
      />
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppCard style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {getExpenseTypeLabel(expense.type)} · #{expense.id}
        </Text>
        <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        <Text style={styles.summaryLabel}>
          {formatDateString(expense.expenseDate) || '—'}
        </Text>
      </AppCard>
      <AppCard style={styles.card}>
        <Text style={styles.heading}>Expense Information</Text>
        <Text style={styles.label}>Animal</Text>
        <Text style={styles.value}>
          {expense.animal
            ? `${expense.animal.name || 'Animal'} #${expense.animal.id}`
            : 'General expense'}
        </Text>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{expense.notes || 'No notes added'}</Text>
      </AppCard>
      <AppCard>
        <Text style={styles.heading}>Attached Image</Text>
        <TappablePhoto
          imageUrl={expense.imageUrl}
          label="Expense image"
          style={styles.preview}
        />
      </AppCard>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  summary: { backgroundColor: colors.primary, marginBottom: spacing.lg },
  summaryLabel: { fontSize: fontSize.sm, color: colors.white },
  amount: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginVertical: spacing.sm,
  },
  card: { marginBottom: spacing.lg },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  value: { color: colors.text, fontSize: fontSize.md, marginTop: spacing.xs },
  preview: { height: 320, borderRadius: borderRadius.md },
});
export default ViewExpenseDetailsScreen;
