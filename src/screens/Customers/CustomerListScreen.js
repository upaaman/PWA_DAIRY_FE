/**
 * CustomerListScreen
 *
 * Browse list of all customers. Loads GET /customer/getAll, supports a
 * client-side search, and tapping a row opens CustomerDetailsScreen where
 * the full profile can be viewed and edited.
 */
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { CUSTOMER_ROUTES } from '../../navigation/routes';

const HeaderActions = ({ onAdd }) => (
  <Pressable onPress={onAdd} style={styles.headerButton} hitSlop={8}>
    <Text style={styles.headerIcon}>➕</Text>
  </Pressable>
);

const CustomerListScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get('/customer/getAll');
      setCustomers(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderActions onAdd={() => navigation.navigate(CUSTOMER_ROUTES.ADD)} />
      ),
    });
  }, [navigation]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    return customers.filter(customer => {
      const nameMatch = (customer.name || '').toLowerCase().includes(query);
      const contactMatch = (customer.contact || '').includes(query);
      const idMatch = String(customer.id).includes(query);
      return nameMatch || contactMatch || idMatch;
    });
  }, [customers, searchQuery]);

  if (loading) {
    return <Loading message="Loading customers..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load customers"
        message={error.message || 'Something went wrong. Please try again.'}
        actionLabel="Retry"
        onActionPress={loadCustomers}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, contact or ID..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              navigation.navigate(CUSTOMER_ROUTES.DETAILS, {
                customerId: item.id,
              })
            }
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🧑‍🤝‍🧑</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                📞 {item.contact || '—'}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                📍 {item.address || '—'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No customers found"
            message={
              searchQuery
                ? 'Try a different search.'
                : 'Add your first customer to get started.'
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
    borderRadius: borderRadius.md,
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.primaryLight,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  rowMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default CustomerListScreen;
