/**
 * SellerScreen.js
 *
 * Seller details & purchase billing screen:
 * 1. Initial State:
 *    - Loads all sellers from GET /seller/getAll
 *    - Shows dropdown (AppSelect) to pick a seller
 *    - "Get Details" button
 *
 * 2. Active State (after selecting a seller & tapping "Get Details"):
 *    - Dropdown hides and a calendar date-range filter (DateRangeFilter) appears
 *    - Calls GET /purchase/getAll?sellerId=...&startDate=...&endDate=...
 *    - Extracts seller details from purchases[0]?.seller (or selected seller)
 *    - Displays seller profile banner, summary cards, and transactions list
 *    - "Generate Bill" button at top to preview and download/print the PDF invoice
 *    - "Change Seller" option to switch sellers anytime.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { get } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppSelect from '../../components/AppSelect';
import DateRangeFilter from '../../components/DateRangeFilter';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import BillPreviewModal from '../../components/BillPreviewModal';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import { getAnimalIcon, getAnimalTypeLabel } from '../Animals/animalMeta';
import { getShiftLabel } from '../../constants/enums';
import { formatDateString } from '../../utils/date';
import { RANGE_KEYS, getDateRangeForKey, toQueryDateRange } from '../../utils/dateRanges';
import { formatCurrency, formatLiters } from '../../utils/format';
import { printOrDownloadBill, shareBillSummary } from '../../utils/pdfService';

const SellerScreen = ({ navigation }) => {
  // Sellers list state
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [sellersError, setSellersError] = useState(null);

  // Selected seller selection
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [selectError, setSelectError] = useState(null);
  const [isDetailsActive, setIsDetailsActive] = useState(false);

  // Date Range state
  const [range, setRange] = useState(() => ({
    rangeKey: RANGE_KEYS.THIS_MONTH,
    ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
  }));

  // Purchases data state
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchasesError, setPurchasesError] = useState(null);

  // Bill preview / generation state
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch all sellers on mount
  const loadSellers = useCallback(async () => {
    try {
      setLoadingSellers(true);
      setSellersError(null);
      const response = await get('/seller/getAll');
      const list = Array.isArray(response) ? response : [];
      setSellers(list);
    } catch (err) {
      setSellersError(err);
    } finally {
      setLoadingSellers(false);
    }
  }, []);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  // 2. Fetch purchases when details view is active and range / seller changes
  const loadPurchases = useCallback(async () => {
    if (!selectedSellerId || !isDetailsActive) {
      return;
    }

    try {
      setLoadingPurchases(true);
      setPurchasesError(null);

      const { startDate, endDate } = toQueryDateRange(range);
      const queryParams = [`sellerId=${selectedSellerId}`];
      if (startDate) {
        queryParams.push(`startDate=${startDate}`);
      }
      if (endDate) {
        queryParams.push(`endDate=${endDate}`);
      }

      const endpoint = `/purchase/getAll?${queryParams.join('&')}`;
      const response = await get(endpoint);

      let list = Array.isArray(response) ? response : [];
      // Safety filter on client-side in case backend returned all
      if (list.length > 0 && list[0]?.seller?.id) {
        list = list.filter(item => item.seller?.id === selectedSellerId);
      }

      // Sort newest date first
      list.sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));
      setPurchases(list);
    } catch (err) {
      setPurchasesError(err);
    } finally {
      setLoadingPurchases(false);
    }
  }, [selectedSellerId, isDetailsActive, range]);

  useEffect(() => {
    if (isDetailsActive) {
      loadPurchases();
    }
  }, [isDetailsActive, loadPurchases]);

  const handleGetDetails = () => {
    if (!selectedSellerId) {
      setSelectError('Please select a seller to proceed.');
      return;
    }
    setSelectError(null);
    setIsDetailsActive(true);
  };

  const handleResetSeller = () => {
    setIsDetailsActive(false);
    setPurchases([]);
  };

  // Compute Active Seller info (from 0th purchase record or selected seller object)
  const currentSelectedSeller = sellers.find(s => s.id === selectedSellerId);
  const sellerDetails =
    (purchases.length > 0 && purchases[0]?.seller) ? purchases[0].seller : currentSelectedSeller;

  const { startDate: queryStartDate, endDate: queryEndDate } = toQueryDateRange(range);

  // Totals
  const totalQuantity = purchases.reduce(
    (sum, p) => sum + Number(p.quantity || 0),
    0,
  );
  const totalAmount = purchases.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );
  const avgRate =
    totalQuantity > 0 ? (totalAmount / totalQuantity).toFixed(2) : '0';

  // Bill Number: sellerName + startDate + endDate
  const sellerNameClean = (sellerDetails?.name || 'Seller').trim().replace(/\s+/g, '_');
  const billNumber = `${sellerNameClean}_${queryStartDate || 'all'}_${queryEndDate || 'all'}`;

  const billPayload = {
    billNumber,
    billDate: new Date(),
    startDate: queryStartDate,
    endDate: queryEndDate,
    seller: sellerDetails,
    purchases,
    totalQuantity,
    totalAmount,
  };

  const handleOpenBillModal = () => {
    if (purchases.length === 0) {
      Alert.alert('No Records', 'There are no purchase records in this period to generate a bill.');
      return;
    }
    setBillModalVisible(true);
  };

  const handlePrintOrDownload = async () => {
    try {
      setIsExporting(true);
      await printOrDownloadBill(billPayload);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    await shareBillSummary(billPayload);
  };

  // Render Initial View: Seller Dropdown + Get Details
  if (!isDetailsActive) {
    if (loadingSellers) {
      return <Loading message="Loading sellers..." />;
    }

    if (sellersError) {
      return (
        <EmptyState
          icon="⚠️"
          title="Couldn't load sellers"
          message={sellersError.message || 'Please try again.'}
          actionLabel="Retry"
          onActionPress={loadSellers}
        />
      );
    }

    const sellerOptions = sellers.map(s => ({
      label: `${s.name}${s.contact ? ` (${s.contact})` : ''}`,
      value: s.id,
    }));

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.initialContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Card */}
          <AppCard style={styles.selectionCard}>
            <View style={styles.headerIconRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>👨‍🌾</Text>
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.pageTitle}>Seller Details & Billing</Text>
                <Text style={styles.pageSubtitle}>
                  Select a seller to view milk purchases, calculate payouts, and generate PDF bills.
                </Text>
              </View>
            </View>

            <View style={styles.dropdownSection}>
              <AppSelect
                label="Select Seller *"
                placeholder="Choose a seller from list"
                value={selectedSellerId}
                options={sellerOptions}
                onSelect={val => {
                  setSelectedSellerId(val);
                  setSelectError(null);
                }}
                error={selectError}
              />

              {currentSelectedSeller ? (
                <View style={styles.selectedSellerSnippet}>
                  <Text style={styles.snippetLabel}>Selected Contact & Address:</Text>
                  <Text style={styles.snippetValue}>
                    📞 {currentSelectedSeller.contact || 'No phone'} · 📍 {currentSelectedSeller.address || 'No address'}
                  </Text>
                </View>
              ) : null}

              <AppButton
                title="Get Details"
                onPress={handleGetDetails}
                style={styles.getDetailsBtn}
              />
              <AppButton
                title="+ Add Seller"
                onPress={() => navigation.navigate('AddSeller')}
                style={styles.addSellerBtn}
              />
            </View>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render Active Details View
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={purchases}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingPurchases}
            onRefresh={loadPurchases}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Top Bar with Selected Seller & Change button */}
            <View style={styles.sellerHeaderCard}>
              <View style={styles.sellerHeaderLeft}>
                <View style={styles.sellerAvatarBadge}>
                  <Text style={styles.sellerAvatarEmoji}>🧑‍🌾</Text>
                </View>
                <View style={styles.sellerInfoGroup}>
                  <Text style={styles.sellerHeaderName}>{sellerDetails?.name || 'Seller'}</Text>
                  <Text style={styles.sellerHeaderMeta} numberOfLines={1}>
                    📞 {sellerDetails?.contact || '—'} · 📍 {sellerDetails?.address || '—'}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.changeSellerBtn}
                onPress={handleResetSeller}
                hitSlop={8}
              >
                <Text style={styles.changeSellerBtnText}>Change</Text>
              </Pressable>
            </View>

            {/* Action Row: Generate Bill Button */}
            <View style={styles.actionsHeaderRow}>
              <View style={styles.billNumberTag}>
                <Text style={styles.billNumberTagLabel}>Bill No:</Text>
                <Text style={styles.billNumberTagValue} numberOfLines={1}>{billNumber}</Text>
              </View>
              <AppButton
                title="Generate Bill"
                onPress={handleOpenBillModal}
                disabled={loadingPurchases || purchases.length === 0}
                style={styles.generateBillBtn}
              />
            </View>

            {/* Date Range Filter (Today / This Week / This Month / Custom) */}
            <DateRangeFilter
              value={range}
              onChange={setRange}
              style={styles.dateFilter}
            />

            {/* Metric Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.cardBlue]}>
                <Text style={styles.summaryCardEmoji}>🥛</Text>
                <Text style={[styles.summaryCardLabel, styles.textBlueLabel]}>Total Milk</Text>
                <Text style={[styles.summaryCardValue, styles.textBlueValue]}>
                  {formatLiters(totalQuantity)}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.cardGreen]}>
                <Text style={styles.summaryCardEmoji}>💸</Text>
                <Text style={[styles.summaryCardLabel, styles.textGreenLabel]}>Total Amount</Text>
                <Text style={[styles.summaryCardValue, styles.textGreenValue]}>
                  {formatCurrency(totalAmount) || '₹0'}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.cardPurple]}>
                <Text style={styles.summaryCardEmoji}>📈</Text>
                <Text style={[styles.summaryCardLabel, styles.textPurpleLabel]}>Avg Rate</Text>
                <Text style={[styles.summaryCardValue, styles.textPurpleValue]}>
                  ₹{avgRate}/L
                </Text>
              </View>
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Purchase Records ({purchases.length})
              </Text>
              <Text style={styles.sectionDateRange}>
                {formatDateString(queryStartDate)} - {formatDateString(queryEndDate)}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.purchaseRowCard}>
            <View style={styles.purchaseRowLeft}>
              <View style={styles.animalIconBox}>
                <Text style={styles.animalIconText}>{getAnimalIcon(item.animalType)}</Text>
              </View>
              <View style={styles.purchaseDetails}>
                <View style={styles.purchaseTopLine}>
                  <Text style={styles.purchaseDateText}>
                    {formatDateString(item.purchaseDate) || '—'}
                  </Text>
                  <View style={styles.shiftBadge}>
                    <Text style={styles.shiftBadgeText}>{getShiftLabel(item.shift)}</Text>
                  </View>
                </View>
                <Text style={styles.purchaseSubtext}>
                  {getAnimalTypeLabel(item.animalType)} · {Number(item.quantity || 0).toFixed(2)} L @ ₹{Number(item.rate || 0).toFixed(2)}/L
                </Text>
              </View>
            </View>

            <View style={styles.purchaseRowRight}>
              <Text style={styles.purchaseAmountText}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.purchaseQtyText}>{formatLiters(item.quantity)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loadingPurchases ? (
            <Loading message="Loading seller purchases..." />
          ) : purchasesError ? (
            <EmptyState
              icon="⚠️"
              title="Couldn't load purchases"
              message={purchasesError.message || 'Please try again.'}
              actionLabel="Retry"
              onActionPress={loadPurchases}
            />
          ) : (
            <EmptyState
              icon="🥛"
              title="No purchases found"
              message="No milk purchase records found for this seller in the selected date range."
            />
          )
        }
      />

      {/* Bill Preview Modal */}
      <BillPreviewModal
        visible={billModalVisible}
        onClose={() => setBillModalVisible(false)}
        billData={billPayload}
        onPrintOrDownload={handlePrintOrDownload}
        onShare={handleShare}
        isExporting={isExporting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  initialContent: {
    padding: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  selectionCard: {
    padding: spacing.lg,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  headerTextGroup: {
    flex: 1,
  },
  pageTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  pageSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  dropdownSection: {
    marginTop: spacing.xs,
  },
  selectedSellerSnippet: {
    backgroundColor: colors.background,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  snippetLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  snippetValue: {
    fontSize: 12,
    color: colors.text,
  },
  getDetailsBtn: {
    marginTop: spacing.xs,
  },
  addSellerBtn: {
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
},

  /* Active Details Styles */
  sellerHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sellerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  sellerAvatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sellerAvatarEmoji: {
    fontSize: 20,
  },
  sellerInfoGroup: {
    flex: 1,
  },
  sellerHeaderName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sellerHeaderMeta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  changeSellerBtn: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeSellerBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  actionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  billNumberTag: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  billNumberTagLabel: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: '#1E40AF',
  },
  billNumberTagValue: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
  },
  generateBillBtn: {
    paddingHorizontal: spacing.md,
    minHeight: 40,
    backgroundColor: colors.primary,
  },
  dateFilter: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
  },
  cardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  cardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cardPurple: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  textBlueLabel: {
    color: '#1E40AF',
  },
  textBlueValue: {
    color: '#1E3A8A',
  },
  textGreenLabel: {
    color: '#065F46',
  },
  textGreenValue: {
    color: '#064E3B',
  },
  textPurpleLabel: {
    color: '#5B21B6',
  },
  textPurpleValue: {
    color: '#4C1D95',
  },
  summaryCardEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  summaryCardValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sectionDateRange: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  purchaseRowCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  purchaseRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  animalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  animalIconText: {
    fontSize: 18,
  },
  purchaseDetails: {
    flex: 1,
  },
  purchaseTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  purchaseDateText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  shiftBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  shiftBadgeText: {
    fontSize: 9.5,
    fontWeight: fontWeight.semibold,
    color: '#2563EB',
  },
  purchaseSubtext: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  purchaseRowRight: {
    alignItems: 'flex-end',
  },
  purchaseAmountText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.info,
  },
  purchaseQtyText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default SellerScreen;
