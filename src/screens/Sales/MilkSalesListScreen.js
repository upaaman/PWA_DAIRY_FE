/**
 * MilkSalesListScreen
 *
 * Real backend data via a single request:
 *   GET /milkSale/getAll?startDate=...&endDate=...
 * (all query params are optional on this endpoint).
 *
 * No summary/"Total Sales" card here per product decision — just the
 * date filter and the list.
 *
 * Payment method is NOT shown — the backend MilkSale entity has no
 * such field (only saleDate, quantity, rate, shift, animalType,
 * customer, amount). Not invented here.
 */
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateRangeFilter from '../../components/DateRangeFilter';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import DraggableAddButton from '../../components/DraggableAddButton';
import { fontSize, spacing } from '../../constants/appConstants';
import { RANGE_KEYS, getDateRangeForKey } from '../../utils/dateRanges';
import { SALES_ROUTES } from '../../navigation/routes';
import useSalesRecords from './useSalesRecords';
import SaleListItem from './SaleListItem';

const AddHeaderButton = ({ onPress }) => (
  <Pressable onPress={onPress} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>➕</Text>
  </Pressable>
);

const MilkSalesListScreen = ({ navigation }) => {
  const [range, setRange] = useState(() => ({
    rangeKey: RANGE_KEYS.THIS_MONTH,
    ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
  }));

  const { sales, loading, error, reload } = useSalesRecords(range);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const openAdd = useCallback(() => {
    navigation.navigate(SALES_ROUTES.ADD);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <AddHeaderButton onPress={openAdd} />,
    });
  }, [navigation, openAdd]);

  if (loading) {
    return <Loading message="Loading sales..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load sales"
        message={error.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={reload}
      />
    );
  }

  return (
    <View style={styles.container}>
      <DateRangeFilter
        value={range}
        onChange={setRange}
        style={styles.chipsRow}
      />

      <FlatList
        data={sales}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <SaleListItem
            sale={item}
            onPress={() =>
              navigation.navigate(SALES_ROUTES.DETAILS, { sale: item })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No sales found"
            message="Try a different date range, or record a new sale."
          />
        }
      />
      <DraggableAddButton
        compact
        onPress={openAdd}
        label="Add Sale"
        storageKey="sales.addButton.position.v1"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chipsRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
    flexGrow: 1,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default MilkSalesListScreen;
