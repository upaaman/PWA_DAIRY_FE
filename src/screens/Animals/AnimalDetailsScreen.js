/**
 * AnimalDetailsScreen
 *
 * Shows full details for one animal plus its milk production summary.
 *
 * Data comes from two real backend endpoints:
 *   GET /animal/get/{id}                       (AnimalController.getAnimalById)
 *   GET /milkProduction/getAll?animalId={id}     (MilkProductionController.getAllMilkProduction)
 *
 * Delete uses:
 *   DELETE /animal/deleteAnimal/{id}             (AnimalController.deleteAnimalWithId)
 *
 * There is no update/edit endpoint on the backend (AnimalController only
 * exposes create/getAll/get/{id}/delete), so the Edit action is a
 * placeholder for now — it does not call any invented endpoint.
 */
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { del, get } from '../../api/decentralizedWrapper';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { formatDateString } from '../../utils/date';
import { formatCurrency, formatLiters } from '../../utils/format';
import { PRODUCTION_ROUTES, TABS } from '../../navigation/routes';
import {
  getAnimalIcon,
  getAnimalTypeLabel,
  getGenderLabel,
  getStatusColor,
  getStatusLabel,
} from './animalMeta';
import DetailRow from './DetailRow';
import ProductionRecordRow from './ProductionRecordRow';

const RECENT_RECORDS_LIMIT = 5;

// Defined outside the screen so it isn't re-created every render
// (navigation.setOptions needs a stable component reference).
const HeaderActions = ({ onEdit, onDelete }) => (
  <View style={styles.headerActions}>
    <Pressable onPress={onEdit} style={styles.headerButton} hitSlop={8}>
      <Text style={styles.headerIcon}>✏️</Text>
    </Pressable>
    <Pressable onPress={onDelete} style={styles.headerButton} hitSlop={8}>
      <Text style={styles.headerIcon}>🗑️</Text>
    </Pressable>
  </View>
);

const AnimalDetailsScreen = ({ navigation, route }) => {
  const { animalId } = route.params || {};

  const [animal, setAnimal] = useState(null);
  const [animalLoading, setAnimalLoading] = useState(true);
  const [animalError, setAnimalError] = useState(null);

  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const loadAnimal = useCallback(async () => {
    try {
      setAnimalLoading(true);
      setAnimalError(null);
      const response = await get(`/animal/get/${animalId}`);
      setAnimal(response);
    } catch (err) {
      setAnimalError(err);
    } finally {
      setAnimalLoading(false);
    }
  }, [animalId]);

  const loadProduction = useCallback(async () => {
    try {
      setRecordsLoading(true);
      setRecordsError(null);
      const response = await get(`/milkProduction/getAll?animalId=${animalId}`);
      setRecords(Array.isArray(response) ? response : []);
    } catch (err) {
      setRecordsError(err);
    } finally {
      setRecordsLoading(false);
    }
  }, [animalId]);

  useFocusEffect(
    useCallback(() => {
      loadAnimal();
      loadProduction();
    }, [loadAnimal, loadProduction]),
  );

  const handleEdit = useCallback(() => {
    // No update/edit endpoint exists on the backend yet
    // (AnimalController only has create/getAll/get/{id}/delete).
    Alert.alert('Edit Animal', 'Editing animals is coming soon.');
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Animal',
      `Are you sure you want to delete ${animal?.name || 'this animal'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await del(`/animal/deleteAnimal/${animalId}`);
              Alert.alert('Deleted', 'Animal deleted successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert(
                'Could not delete animal',
                err.message || 'Something went wrong. Please try again.',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [animal, animalId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: animal?.name || 'Animal Details',
      headerRight: () => (
        <HeaderActions onEdit={handleEdit} onDelete={handleDelete} />
      ),
    });
  }, [navigation, animal, handleEdit, handleDelete]);

  const productionSummary = useMemo(() => {
    if (!records.length) {
      return { total: 0, average: 0, recent: [] };
    }

    const total = records.reduce(
      (sum, record) => sum + Number(record.quantity || 0),
      0,
    );
    const distinctDays = new Set(records.map(record => record.productionDate))
      .size;
    const average = distinctDays > 0 ? total / distinctDays : 0;

    const recent = [...records]
      .sort((a, b) => {
        if (a.productionDate === b.productionDate) {
          return (b.id || 0) - (a.id || 0);
        }
        return (b.productionDate || '').localeCompare(a.productionDate || '');
      })
      .slice(0, RECENT_RECORDS_LIMIT);

    return { total, average, recent };
  }, [records]);

  if (animalLoading) {
    return <Loading message="Loading animal..." />;
  }

  if (animalError || !animal) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load animal"
        message={
          animalError?.message || 'This animal could not be found.'
        }
        actionLabel="Retry"
        onActionPress={loadAnimal}
      />
    );
  }

  const typeLabel = getAnimalTypeLabel(animal.type);
  const genderLabel = getGenderLabel(animal.gender);
  const statusLabel = getStatusLabel(animal.status);
  const statusColor = getStatusColor(animal.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>{getAnimalIcon(animal.type)}</Text>
         {/* <Image
        style={{height:150,width:230}}
         source={{
      uri: "https://drive.google.com/uc?export=download&id=1OUejHErCoaQFUCoxcy4eCa-RQPDWozVV"
    }}
        /> */}
      </View>

      <View style={styles.identityRow}>
        <Text style={styles.name}>{animal.name || 'Unnamed'}</Text>
        <View style={styles.idBadge}>
          <Text style={styles.idBadgeText}>#{animal.id}</Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{typeLabel}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{genderLabel}</Text>
        </View>
        <View style={[styles.badge, styles.statusBadge]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
      </View>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailRow label="Breed" value={animal.breed} />
        {animal.dateOfBirth &&<DetailRow label="Date of Birth" value={formatDateString(animal.dateOfBirth)} />}
        {animal.dateOfPurchase && <DetailRow label="Purchase Date" value={formatDateString(animal.dateOfPurchase)} />}
        <DetailRow label="Purchase Price" value={formatCurrency(animal.purchasePrice)} />
        {animal.notes ? <DetailRow label="Notes" value={animal.notes} /> : null}
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Milk Production</Text>

        {recordsLoading ? (
          <Loading message="Loading production records..." />
        ) : recordsError ? (
          <EmptyState
            icon="⚠️"
            title="Couldn't load production"
            message={recordsError.message || 'Please try again.'}
            actionLabel="Retry"
            onActionPress={loadProduction}
          />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {formatLiters(productionSummary.total)}
                </Text>
                <Text style={styles.statLabel}>Total Production</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {formatLiters(productionSummary.average)}
                </Text>
                <Text style={styles.statLabel}>Avg / Day</Text>
              </View>
            </View>

            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recent Records</Text>
              <Text
                style={styles.viewAll}
                onPress={() =>
                  navigation.navigate(TABS.PRODUCTION, {
                    screen: PRODUCTION_ROUTES.HISTORY,
                  })
                }
              >
                View All
              </Text>
            </View>

            {productionSummary.recent.length === 0 ? (
              <EmptyState
                title="No production records yet"
                message="Milk production for this animal will show up here."
              />
            ) : (
              productionSummary.recent.map(record => (
                <ProductionRecordRow key={record.id} record={record} />
              ))
            )}
          </>
        )}
      </AppCard>

      <AppButton
        title="Delete Animal"
        variant="outline"
        onPress={handleDelete}
        loading={deleting}
        style={styles.deleteButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  banner: {
    height: 160,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: {
    fontSize: 72,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  idBadge: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  statusBadge: {
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  recentTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  viewAll: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  deleteButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    paddingHorizontal: spacing.xs,
  },
  headerIcon: {
    fontSize: fontSize.lg,
  },
});

export default AnimalDetailsScreen;
