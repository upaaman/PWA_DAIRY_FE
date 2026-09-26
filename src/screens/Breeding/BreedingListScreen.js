/**
 * BreedingListScreen
 *
 * Breeding register loaded from the real backend endpoint:
 *   GET /breeding/getAll
 * (returns id, animal, breedingDate, method, expectedCalvingDate,
 *  actualCalvingDate, status, optional producedAnimal and notes)
 *
 * Records can be searched (mother / calf name, animal id, notes) and
 * filtered by breeding status. Tapping a record opens the update form
 * (EditBreedingScreen -> PATCH /breeding/update/{id}).
 */
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import FilterChip from '../../components/FilterChip';
import Loading from '../../components/Loading';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '../../constants/appConstants';
import { BREEDING_STATUS_OPTIONS } from '../../constants/breedingEnums';
import { BREEDING_ROUTES } from '../../navigation/routes';
import BreedingListItem from './BreedingListItem';

const FILTER_ALL = 'ALL';

const AddHeaderButton = ({ onPress }) => (
  <Pressable onPress={onPress} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>➕</Text>
  </Pressable>
);

const BreedingListScreen = ({ navigation }) => {
  const [breedings, setBreedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);

  const loadBreedings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await get('/breeding/getAll');
      const list = Array.isArray(response) ? response : [];
      list.sort((a, b) => {
        const dateCompare = String(b.breedingDate || '').localeCompare(
          String(a.breedingDate || ''),
        );
        return dateCompare !== 0 ? dateCompare : (b.id || 0) - (a.id || 0);
      });
      setBreedings(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBreedings();
    }, [loadBreedings]),
  );

  const openAdd = useCallback(() => {
    navigation.navigate(BREEDING_ROUTES.ADD);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <AddHeaderButton onPress={openAdd} />,
    });
  }, [navigation, openAdd]);

  const statusCounts = useMemo(() => {
    const counts = { [FILTER_ALL]: breedings.length };
    breedings.forEach(breeding => {
      const key = breeding.status || FILTER_ALL;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [breedings]);

  const stats = useMemo(
    () => ({
      total: breedings.length,
      pregnant: breedings.filter(item => item.status === 'PREGNANT').length,
      calved: breedings.filter(item => item.status === 'CALVED').length,
    }),
    [breedings],
  );

  const filteredBreedings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return breedings.filter(breeding => {
      const statusMatch =
        statusFilter === FILTER_ALL || breeding.status === statusFilter;
      if (!statusMatch) {
        return false;
      }
      if (!query) {
        return true;
      }

      const motherName = (breeding.animal?.name || '').toLowerCase();
      const motherId = String(breeding.animal?.id ?? '').toLowerCase();
      const calfName = (breeding.producedAnimal?.name || '').toLowerCase();
      const method = (breeding.method || '').toLowerCase();
      const notes = (breeding.notes || '').toLowerCase();
      return (
        motherName.includes(query) ||
        motherId.includes(query) ||
        calfName.includes(query) ||
        method.includes(query) ||
        notes.includes(query)
      );
    });
  }, [breedings, searchQuery, statusFilter]);

  if (loading && breedings.length === 0) {
    return <Loading message="Loading breeding records..." />;
  }

  if (error && breedings.length === 0) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load breeding records"
        message={error.message || 'Something went wrong. Please try again.'}
        actionLabel="Retry"
        onActionPress={() => loadBreedings()}
      />
    );
  }

  const listHeader = (
    <>
      <View style={styles.hero}>
        <View style={styles.heroCircleLarge} />
        <View style={styles.heroCircleSmall} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroIcon}>🤰</Text>
          </View>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroTitle}>Breeding Register</Text>
            <Text style={styles.heroSubtitle}>
              Track breeding, expected calving and calves born on your farm.
            </Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{stats.total}</Text>
            <Text style={styles.heroStatLabel}>Records</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{stats.pregnant}</Text>
            <Text style={styles.heroStatLabel}>Pregnant</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{stats.calved}</Text>
            <Text style={styles.heroStatLabel}>Calved</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search animal, calf, method or notes..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        <FilterChip
          label="All"
          count={statusCounts[FILTER_ALL] || 0}
          active={statusFilter === FILTER_ALL}
          onPress={() => setStatusFilter(FILTER_ALL)}
        />
        {BREEDING_STATUS_OPTIONS.map(option => (
          <FilterChip
            key={option.value}
            label={option.label}
            count={statusCounts[option.value] || 0}
            active={statusFilter === option.value}
            onPress={() => setStatusFilter(option.value)}
          />
        ))}
      </ScrollView>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Breeding Records</Text>
        <Text style={styles.sectionCount}>{filteredBreedings.length}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBreedings}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BreedingListItem
            breeding={item}
            onPress={() =>
              navigation.navigate(BREEDING_ROUTES.EDIT, { breeding: item })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBreedings(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          searchQuery || statusFilter !== FILTER_ALL ? (
            <EmptyState
              icon="🔍"
              title="No matching records"
              message="Try a different search or status filter."
            />
          ) : (
            <EmptyState
              icon="🤰"
              title="No breeding records yet"
              message="Record the first breeding for one of your animals."
              actionLabel="Add Breeding"
              onActionPress={openAdd}
            />
          )
        }
      />

      {filteredBreedings.length > 0 ? (
        <View style={styles.fabWrap}>
          <AppButton
            title="Add Breeding"
            onPress={openAdd}
            style={styles.fab}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    flexGrow: 1,
  },

  /* Hero */
  hero: {
    backgroundColor: colors.primaryDeep,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroCircleLarge: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.green700,
    opacity: 0.45,
  },
  heroCircleSmall: {
    position: 'absolute',
    bottom: -60,
    left: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.green600,
    opacity: 0.3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heroIcon: {
    fontSize: 26,
  },
  heroTextGroup: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: 16,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  /* Search + filters */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
  },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.md,
  },
  chipsRow: {
    alignItems: 'flex-start',
    paddingRight: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sectionCount: {
    marginLeft: spacing.sm,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  /* Floating add button */
  fabWrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  fab: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    ...shadows.floating,
  },

  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default BreedingListScreen;
