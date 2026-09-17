/**
 * CustomerScreen.js
 *
 * Customer details & sales billing screen — mirrors SellerScreen.js but
 * for the other side of the ledger: customers BUY milk from us (money
 * owed TO us), via the MilkSale entity/endpoints, instead of sellers
 * SELLING milk to us (money we owe them) via MilkPurchase.
 *
 * 1. Initial State:
 *    - Loads all customers from GET /customer/getAll
 *    - Shows dropdown (AppSelect) to pick a customer
 *    - "Get Details" button
 *
 * 2. Active State (after selecting a customer & tapping "Get Details"):
 *    - Dropdown hides and a calendar date-range filter (DateRangeFilter) appears
 *    - Calls GET /milkSale/getAll?customerId=...&startDate=...&endDate=...
 *    - Extracts customer details from sales[0]?.customer (or selected customer)
 *    - Displays customer profile banner, summary cards, and transactions list
 *    - "Generate Bill" button at top to preview and download/print the PDF invoice
 *      (billed as a Sales Invoice — "To be paid by Customer" — via the same
 *      generic BillPreviewModal/pdfService used for sellers, just passing
 *      `customer`/`sales`/`partyRole: 'customer'` instead of `seller`/`purchases`)
 *    - "Change Customer" option to switch customers anytime.
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
import { useIsFocused } from '@react-navigation/native';
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
import { CUSTOMER_ROUTES } from '../../navigation/routes';
import { formatDateString } from '../../utils/date';
import { RANGE_KEYS, getDateRangeForKey, toQueryDateRange } from '../../utils/dateRanges';
import { formatCurrency, formatLiters } from '../../utils/format';
import { printOrDownloadBill, shareBillSummary } from '../../utils/pdfService';

const CustomerScreen = ({navigation, route}) => {
  const isFocused = useIsFocused();
  // Customers list state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState(null);

  // Selected customer selection. A customerId passed via navigation (from
  // CustomerDetailsScreen) opens straight into the billing view.
  const preselectedCustomerId = route.params?.customerId ?? null;
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId);
  const [selectError, setSelectError] = useState(null);
  const [isDetailsActive, setIsDetailsActive] = useState(Boolean(preselectedCustomerId));

  // Date Range state
  const [range, setRange] = useState(() => ({
    rangeKey: RANGE_KEYS.THIS_MONTH,
    ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
  }));

  // Sales data state
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesError, setSalesError] = useState(null);

  // Bill preview / generation state
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch all customers on mount
  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      setCustomersError(null);
      const response = await get('/customer/getAll');
      const list = Array.isArray(response) ? response : [];
      setCustomers(list);
    } catch (err) {
      setCustomersError(err);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Reload customers whenever the screen gains focus so a customer added
  // on the AddCustomer screen shows up immediately after returning.
  useEffect(() => {
    if (isFocused) {
      loadCustomers();
    }
  }, [isFocused, loadCustomers]);

  // React to a customer being handed to this screen (from CustomerDetails).
  useEffect(() => {
    if (route.params?.customerId) {
      setSelectedCustomerId(route.params.customerId);
      setIsDetailsActive(true);
    }
  }, [route.params?.customerId]);

  // 2. Fetch sales when details view is active and range / customer changes
  const loadSales = useCallback(async () => {
    if (!selectedCustomerId || !isDetailsActive) {
      return;
    }

    try {
      setLoadingSales(true);
      setSalesError(null);

      const { startDate, endDate } = toQueryDateRange(range);
      const queryParams = [`customerId=${selectedCustomerId}`];
      if (startDate) {
        queryParams.push(`startDate=${startDate}`);
      }
      if (endDate) {
        queryParams.push(`endDate=${endDate}`);
      }

      const endpoint = `/milkSale/getAll?${queryParams.join('&')}`;
      const response = await get(endpoint);

      let list = Array.isArray(response) ? response : [];
      // Safety filter on client-side in case backend returned all
      if (list.length > 0 && list[0]?.customer?.id) {
        list = list.filter(item => item.customer?.id === selectedCustomerId);
      }

      // Sort newest date first
      list.sort((a, b) => (b.saleDate || '').localeCompare(a.saleDate || ''));
      setSales(list);
    } catch (err) {
      setSalesError(err);
    } finally {
      setLoadingSales(false);
    }
  }, [selectedCustomerId, isDetailsActive, range]);

  useEffect(() => {
    if (isDetailsActive) {
      loadSales();
    }
  }, [isDetailsActive, loadSales]);

  const handleGetDetails = () => {
    if (!selectedCustomerId) {
      setSelectError('Please select a customer to proceed.');
      return;
    }
    setSelectError(null);
    setIsDetailsActive(true);
  };

  // Compute Active Customer info (from 0th sale record or selected customer object)
  const currentSelectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerDetails =
    (sales.length > 0 && sales[0]?.customer) ? sales[0].customer : currentSelectedCustomer;

  const { startDate: queryStartDate, endDate: queryEndDate } = toQueryDateRange(range);

  // Totals
  const totalQuantity = sales.reduce(
    (sum, s) => sum + Number(s.quantity || 0),
    0,
  );
  const totalAmount = sales.reduce(
    (sum, s) => sum + Number(s.amount || 0),
    0,
  );
  const avgRate =
    totalQuantity > 0 ? (totalAmount / totalQuantity).toFixed(2) : '0';

  // Bill Number: customerName + startDate + endDate
  const customerNameClean = (customerDetails?.name || 'Customer').trim().replace(/\s+/g, '_');
  const billNumber = `${customerNameClean}_${queryStartDate || 'all'}_${queryEndDate || 'all'}`;

  const billPayload = {
    billNumber,
    billDate: new Date(),
    startDate: queryStartDate,
    endDate: queryEndDate,
    partyRole: 'customer',
    customer: customerDetails,
    sales,
    dateField: 'saleDate',
    totalQuantity,
    totalAmount,
  };

  const handleOpenBillModal = () => {
    if (sales.length === 0) {
      Alert.alert('No Records', 'There are no sale records in this period to generate a bill.');
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

  // Render Initial View: Customer Dropdown + Get Details
  if (!isDetailsActive) {
    if (loadingCustomers) {
      return <Loading message="Loading customers..." />;
    }

    if (customersError) {
      return (
        <EmptyState
          icon="⚠️"
          title="Couldn't load customers"
          message={customersError.message || 'Please try again.'}
          actionLabel="Retry"
          onActionPress={loadCustomers}
        />
      );
    }

    const customerOptions = customers.map(c => ({
      label: `${c.name}${c.contact ? ` (${c.contact})` : ''}`,
      value: c.id,
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
                <Text style={styles.avatarEmoji}>🧑‍🤝‍🧑</Text>
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.pageTitle}>Customer Details & Billing</Text>
                <Text style={styles.pageSubtitle}>
                  Select a customer to view milk sales, calculate dues, and generate PDF invoices.
                </Text>
              </View>
            </View>

            <View style={styles.dropdownSection}>
              <AppSelect
                label="Select Customer *"
                placeholder="Choose a customer from list"
                value={selectedCustomerId}
                options={customerOptions}
                onSelect={val => {
                  setSelectedCustomerId(val);
                  setSelectError(null);
                }}
                error={selectError}
              />

              {currentSelectedCustomer ? (
                <View style={styles.selectedCustomerSnippet}>
                  <Text style={styles.snippetLabel}>Selected Contact & Address:</Text>
                  <Text style={styles.snippetValue}>
                    📞 {currentSelectedCustomer.contact || 'No phone'} · 📍 {currentSelectedCustomer.address || 'No address'}
                  </Text>
                </View>
              ) : null}

              <AppButton
                title="Get Details"
                onPress={handleGetDetails}
                style={styles.getDetailsBtn}
              />

              {/* Divider + "Add new customer" tile — separate from the primary action */}
              <View style={styles.addDividerRow}>
                <View style={styles.addDividerLine} />
                <Text style={styles.addDividerText}>or</Text>
                <View style={styles.addDividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [styles.addPartyTile, pressed && styles.addPartyTilePressed]}
                onPress={() => navigation.navigate(CUSTOMER_ROUTES.ADD)}
                hitSlop={4}
              >
                <View style={styles.addPartyBadge}>
                  <Text style={styles.addPartyBadgeText}>+</Text>
                </View>
                <View style={styles.addPartyTextGroup}>
                  <Text style={styles.addPartyTitle}>Add New Customer</Text>
                  <Text style={styles.addPartySubtitle}>
                    Don't find your customer here? Register a new one.
                  </Text>
                </View>
                <Text style={styles.addPartyChevron}>›</Text>
              </Pressable>
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
        data={sales}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingSales}
            onRefresh={loadSales}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Selected Customer banner */}
            <View style={styles.customerHeaderCard}>
              <View style={styles.customerHeaderLeft}>
                <View style={styles.customerAvatarBadge}>
                  <Text style={styles.customerAvatarEmoji}>🧑‍🤝‍🧑</Text>
                </View>
                <View style={styles.customerInfoGroup}>
                  <Text style={styles.customerHeaderName}>{customerDetails?.name || 'Customer'}</Text>
                  <Text style={styles.customerHeaderMeta} numberOfLines={1}>
                    📞 {customerDetails?.contact || '—'} · 📍 {customerDetails?.address || '—'}
                  </Text>
                </View>
              </View>
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
                disabled={loadingSales || sales.length === 0}
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
                <Text style={styles.summaryCardEmoji}>💰</Text>
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
                Sale Records ({sales.length})
              </Text>
              <Text style={styles.sectionDateRange}>
                {formatDateString(queryStartDate)} - {formatDateString(queryEndDate)}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.saleRowCard}>
            <View style={styles.saleRowLeft}>
              <View style={styles.animalIconBox}>
                <Text style={styles.animalIconText}>{getAnimalIcon(item.animalType)}</Text>
              </View>
              <View style={styles.saleDetails}>
                <View style={styles.saleTopLine}>
                  <Text style={styles.saleDateText}>
                    {formatDateString(item.saleDate) || '—'}
                  </Text>
                  <View style={styles.shiftBadge}>
                    <Text style={styles.shiftBadgeText}>{getShiftLabel(item.shift)}</Text>
                  </View>
                </View>
                <Text style={styles.saleSubtext}>
                  {getAnimalTypeLabel(item.animalType)} · {Number(item.quantity || 0).toFixed(2)} L @ ₹{Number(item.rate || 0).toFixed(2)}/L
                </Text>
              </View>
            </View>

            <View style={styles.saleRowRight}>
              <Text style={styles.saleAmountText}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.saleQtyText}>{formatLiters(item.quantity)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loadingSales ? (
            <Loading message="Loading customer sales..." />
          ) : salesError ? (
            <EmptyState
              icon="⚠️"
              title="Couldn't load sales"
              message={salesError.message || 'Please try again.'}
              actionLabel="Retry"
              onActionPress={loadSales}
            />
          ) : (
            <EmptyState
              icon="🥛"
              title="No sales found"
              message="No milk sale records found for this customer in the selected date range."
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
  selectedCustomerSnippet: {
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
  addDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  addDividerLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  addDividerText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addPartyTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: colors.info,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  addPartyTilePressed: {
    backgroundColor: '#DBEAFE',
  },
  addPartyBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPartyBadgeText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
  },
  addPartyTextGroup: {
    flex: 1,
  },
  addPartyTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  addPartySubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  addPartyChevron: {
    fontSize: 24,
    color: colors.info,
    fontWeight: fontWeight.semibold,
  },

  /* Active Details Styles */
  customerHeaderCard: {
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
  customerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  customerAvatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  customerAvatarEmoji: {
    fontSize: 20,
  },
  customerInfoGroup: {
    flex: 1,
  },
  customerHeaderName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  customerHeaderMeta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
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
  saleRowCard: {
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
  saleRowLeft: {
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
  saleDetails: {
    flex: 1,
  },
  saleTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saleDateText: {
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
  saleSubtext: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saleRowRight: {
    alignItems: 'flex-end',
  },
  saleAmountText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  saleQtyText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default CustomerScreen;
