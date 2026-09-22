/**
 * AnimalListScreen
 *
 * Root screen of the Animals stack. Shows a search bar, type filter
 * chips, and the list of animals. Tapping a row navigates to
 * Animal Details.
 *
 * Data comes from two real backend endpoints:
 *   GET /animal/getAll                  active animals (All / Cows / Buffaloes)
 *   GET /animal/getAll/inactive         inactive animals (Inactive chip only)
 *
 * The backend has no query params for searching/filtering, so search +
 * type filtering are done client-side against the fetched lists.
 */
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { fontSize, spacing } from '../../constants/appConstants';
import { ANIMALS_ROUTES } from '../../navigation/routes';
import { FILTER_OPTIONS, matchesFilter } from './animalMeta';
import AnimalListItem from './AnimalListItem';
import FilterChip from '../../components/FilterChip';

// Defined outside the screen so it isn't re-created on every render
// (navigation.setOptions just needs a stable component reference).
const HeaderActions = ({ onFilter, onAdd }) => (
  <View style={styles.headerActions}>
    <Pressable onPress={onFilter} style={styles.headerButton} hitSlop={8}>
      <Text style={styles.headerIcon}>⚙️</Text>
    </Pressable>
    <Pressable onPress={onAdd} style={styles.headerButton} hitSlop={8}>
      <Text style={styles.headerIcon}>➕</Text>
    </Pressable>
  </View>
);

const AnimalListScreen = ({ navigation }) => {
  const [animals, setAnimals] = useState([]);
  const [inactiveAnimals, setInactiveAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const loadAnimals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [activeResponse, inactiveResponse] = await Promise.all([
        get('/animal/getAll'),
        get('/animal/getAll/inactive'),
      ]);
      setAnimals(Array.isArray(activeResponse) ? activeResponse : []);
      setInactiveAnimals(Array.isArray(inactiveResponse) ? inactiveResponse : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time this screen gains focus — e.g. after navigating
  // back from Add Animal — so the list reflects newly created animals.
  useFocusEffect(
    useCallback(() => {
      loadAnimals();
    }, [loadAnimals]),
  );

  // Filter icon: no dedicated "advanced filters" screen/endpoint exists
  // yet for animals (only the type chips below), so this is a
  // placeholder affordance for now. The "+" icon opens the real Add
  // Animal form.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderActions
          onFilter={() =>
            Alert.alert('Filters', 'Advanced filters are coming soon.')
          }
          onAdd={() => navigation.navigate(ANIMALS_ROUTES.ADD)}
        />
      ),
    });
  }, [navigation]);

  const filterCounts = useMemo(() => {
    return FILTER_OPTIONS.reduce((acc, option) => {
      acc[option.key] =
        option.key === 'INACTIVE'
          ? inactiveAnimals.length
          : animals.filter(animal => matchesFilter(animal, option.key)).length;
      return acc;
    }, {});
  }, [animals, inactiveAnimals]);

  const filteredAnimals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    // The Inactive chip shows the dedicated /animal/getAll/inactive list;
    // All / Cows / Buffaloes come from /animal/getAll (inactive excluded).
    const source =
      activeFilter === 'INACTIVE' ? inactiveAnimals : animals;
    return source
      .filter(animal => {
        if (activeFilter === 'INACTIVE') {
          return true;
        }
        return matchesFilter(animal, activeFilter);
      })
      .filter(animal => {
        if (!query) {
          return true;
        }
        const idMatch = String(animal.id).includes(query);
        const nameMatch = (animal.name || '').toLowerCase().includes(query);
        return idMatch || nameMatch;
      });
  }, [animals, inactiveAnimals, activeFilter, searchQuery]);

  const handleAnimalPress = animal => {
    navigation.navigate(ANIMALS_ROUTES.DETAILS, { animalId: animal.id });
  };

  if (loading) {
    return <Loading message="Loading animals..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load animals"
        message={
          error.message || 'Something went wrong. Please try again.'
        }
        actionLabel="Retry"
        onActionPress={loadAnimals}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID or name..."
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
        {FILTER_OPTIONS.map(option => (
          <FilterChip
            key={option.key}
            label={option.label}
            count={filterCounts[option.key] || 0}
            active={activeFilter === option.key}
            onPress={() => setActiveFilter(option.key)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filteredAnimals}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <AnimalListItem animal={item} onPress={() => handleAnimalPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No animals found"
            message={
              searchQuery || activeFilter !== 'ALL'
                ? 'Try a different search or filter.'
                : 'Add your first animal to get started.'
            }
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
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
    marginTop: spacing.md,
  },
  chipsRow: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default AnimalListScreen;
