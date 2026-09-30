/**
 * VaccineListScreen
 *
 * Vaccination records for the animals, loaded from the real backend
 * endpoint:
 *   GET /vaccine/getAll   (returns id, vaccineName, vaccineDate, the
 *                          embedded animal and optional notes)
 *
 * The list is searchable by vaccine name, animal name / ID or notes, and
 * refreshes whenever this screen regains focus so a record added from
 * AddVaccineScreen shows up immediately.
 */
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import colors from '../../constants/colors';
import {
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from '../../constants/appConstants';
import { toISODateString } from '../../utils/date';
import { VACCINE_ROUTES } from '../../navigation/routes';
import VaccineListItem from './VaccineListItem';

const AddHeaderButton = ({ onPress }) => (
  <Pressable onPress={onPress} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>➕</Text>
  </Pressable>
);

const VaccineListScreen = ({ navigation }) => {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadVaccines = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await get('/vaccine/getAll');
      const list = Array.isArray(response) ? response : [];
      list.sort((a, b) => {
        const dateCompare = String(b.vaccineDate || '').localeCompare(
          String(a.vaccineDate || ''),
        );
        return dateCompare !== 0 ? dateCompare : (b.id || 0) - (a.id || 0);
      });
      setVaccines(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVaccines();
    }, [loadVaccines]),
  );

  const openAdd = useCallback(() => {
    navigation.navigate(VACCINE_ROUTES.ADD);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <AddHeaderButton onPress={openAdd} />,
    });
  }, [navigation, openAdd]);

  const stats = useMemo(() => {
    const currentMonth = toISODateString(new Date()).slice(0, 7);
    const animalIds = new Set();
    let thisMonth = 0;

    vaccines.forEach(vaccine => {
      if (vaccine.animal?.id != null) {
        animalIds.add(vaccine.animal.id);
      }
      if (String(vaccine.vaccineDate || '').startsWith(currentMonth)) {
        thisMonth += 1;
      }
    });

    return {
      total: vaccines.length,
      animals: animalIds.size,
      thisMonth,
    };
  }, [vaccines]);

  const filteredVaccines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return vaccines;
    }
    return vaccines.filter(vaccine => {
      const nameMatch = (vaccine.vaccineName || '')
        .toLowerCase()
        .includes(query);
      const animalNameMatch = (vaccine.animal?.name || '')
        .toLowerCase()
        .includes(query);
      const animalIdMatch = String(vaccine.animal?.id ?? '').includes(query);
      const notesMatch = (vaccine.notes || '').toLowerCase().includes(query);
      return nameMatch || animalNameMatch || animalIdMatch || notesMatch;
    });
  }, [vaccines, searchQuery]);

  if (loading && vaccines.length === 0) {
    return <Loading message="Loading vaccine records..." />;
  }

  if (error && vaccines.length === 0) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load vaccine records"
        message={error.message || 'Something went wrong. Please try again.'}
        actionLabel="Retry"
        onActionPress={() => loadVaccines()}
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
            <Text style={styles.heroIcon}>💉</Text>
          </View>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroTitle}>Vaccine Records</Text>
            <Text style={styles.heroSubtitle}>
              Every vaccination given to your animals, in one place.
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
            <Text style={styles.heroStatValue}>{stats.animals}</Text>
            <Text style={styles.heroStatLabel}>Animals</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{stats.thisMonth}</Text>
            <Text style={styles.heroStatLabel}>This Month</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vaccine, animal or notes..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Vaccination History</Text>
        <Text style={styles.sectionCount}>{filteredVaccines.length}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredVaccines}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => <VaccineListItem vaccine={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadVaccines(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          searchQuery ? (
            <EmptyState
              icon="🔍"
              title="No vaccine records found"
              message="Try a different search term."
            />
          ) : (
            <EmptyState
              icon="💉"
              title="No vaccinations yet"
              message="Record the first vaccine given to one of your animals."
            />
          )
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
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

  /* Search + section header */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
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

  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default VaccineListScreen;
