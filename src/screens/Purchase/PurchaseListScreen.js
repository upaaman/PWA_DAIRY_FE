/**
 * PurchaseListScreen
 *
 * Real backend data via a single request:
 *   GET /purchase/getAll?startDate=...&endDate=...
 * (MilkPurchaseController.getAllPurchases — all query params optional).
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
import { PURCHASE_ROUTES } from '../../navigation/routes';
import usePurchaseRecords from './usePurchaseRecords';
import PurchaseListItem from './PurchaseListItem';

const AddHeaderButton = ({ onPress }) => (
  <Pressable onPress={onPress} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>➕</Text>
  </Pressable>
);

const PurchaseListScreen = ({ navigation }) => {
  const [range, setRange] = useState(() => ({
    rangeKey: RANGE_KEYS.THIS_MONTH,
    ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
  }));

  const { purchases, loading, error, reload } = usePurchaseRecords(range);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const openAdd = useCallback(() => {
    navigation.navigate(PURCHASE_ROUTES.ADD);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <AddHeaderButton onPress={openAdd} />,
    });
  }, [navigation, openAdd]);

  if (loading) {
    return <Loading message="Loading purchases..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load purchases"
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
        data={purchases}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <PurchaseListItem
            purchase={item}
            onPress={() =>
              navigation.navigate(PURCHASE_ROUTES.DETAILS, { purchase: item })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No purchases found"
            message="Try a different date range, or record a new purchase."
          />
        }
      />
      <DraggableAddButton
        compact
        onPress={openAdd}
        label="Add Purchase"
        storageKey="purchase.addButton.position.v1"
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

export default PurchaseListScreen;
