/**
 * ProductionListSection
 *
 * Renders the grouped-by-date list of production records (date header
 * with a per-day total, followed by each entry row). Shared by both
 * the Milk Production List and Production History screens, plus their
 * loading/error/empty states.
 */
import React from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatLiters } from '../../utils/format';
import ProductionEntryRow from './ProductionEntryRow';

const ProductionListSection = ({
  grouped,
  loading,
  error,
  onRetry,
  emptyMessage = 'No production records found for the selected filters.',
  ListHeaderComponent,
}) => {
  if (loading) {
    return <Loading message="Loading production records..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load production records"
        message={error.message || 'Please try again.'}
        actionLabel="Retry"
        onActionPress={onRetry}
      />
    );
  }

  const sections = grouped.map(group => ({
    key: group.date,
    date: group.date,
    total: group.total,
    data: group.items,
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => <ProductionEntryRow record={item} />}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionDate}>
            {formatDateString(section.date) || section.date}
          </Text>
          <Text style={styles.sectionTotal}>
            {formatLiters(section.total)}
          </Text>
        </View>
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <EmptyState title="No records found" message={emptyMessage} />
      }
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sectionDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sectionTotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});

export default ProductionListSection;
