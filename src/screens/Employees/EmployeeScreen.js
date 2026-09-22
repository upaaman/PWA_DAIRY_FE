/**
 * EmployeeScreen
 *
 * Employee management hub:
 *   1. Selection state: pick an employee from a dropdown, then
 *      "Get Details" opens the tabs view.
 *   2. Tabbed view:
 *      - Basic Details  -> profile info shown read-only
 *      - Salaries       -> salary slabs for the employee (+ "Add Salary")
 *      - Ledger         -> salary transactions, filterable by date range
 *        and transaction type (+ "Add Transaction")
 *
 * Endpoints:
 *   GET /employee/getAll                    (selection dropdown)
 *   GET /employee/details/{id}              (profile + salaries + totalRemainingAmount)
 *   GET /salaryTransaction/getAll?employeeId=&type=&startDate=&endDate=
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, usePreventRemove } from '@react-navigation/native';
import { get } from '../../api/decentralizedWrapper';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppSelect from '../../components/AppSelect';
import DateRangeFilter from '../../components/DateRangeFilter';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import colors from '../../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/appConstants';
import {
  getEmployeeStatusLabel,
  getSalaryTransactionTypeLabel,
  SALARY_TRANSACTION_TYPE_OPTIONS,
} from '../../constants/employeeEnums';
import { formatDateString } from '../../utils/date';
import { RANGE_KEYS, getDateRangeForKey, toQueryDateRange } from '../../utils/dateRanges';
import { formatCurrency } from '../../utils/format';
import { EMPLOYEE_ROUTES } from '../../navigation/routes';
import DetailRow from '../Animals/DetailRow';

const TABS = [
  { key: 'BASIC', label: 'Basic Details' },
  { key: 'SALARIES', label: 'Salaries' },
  { key: 'LEDGER', label: 'Ledger' },
];

const TYPE_FILTER_OPTIONS = [
  { label: 'All Types', value: null },
  ...SALARY_TRANSACTION_TYPE_OPTIONS,
];

const EmployeeScreen = ({ navigation }) => {
  const isFocused = useIsFocused();

  // Employees list
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState(null);

  // Selection state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectError, setSelectError] = useState(null);
  const [isDetailsActive, setIsDetailsActive] = useState(false);
  const [activeTab, setActiveTab] = useState('BASIC');

  // Details state (GET /employee/details/{id}) — the response carries the
  // employee profile, embedded salaries and totalRemainingAmount.
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Ledger state
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState(null);
  const [txType, setTxType] = useState(null);
  const [range, setRange] = useState(() => ({
    rangeKey: RANGE_KEYS.THIS_MONTH,
    ...getDateRangeForKey(RANGE_KEYS.THIS_MONTH),
  }));

  // While the tabbed details view is active, back collapses back to the
  // employee selection view instead of popping the whole screen (which would
  // jump to the More page).
  usePreventRemove(isDetailsActive, () => {
    setSelectError(null);
    setActiveTab('BASIC');
    setIsDetailsActive(false);
  });

  const loadEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      setEmployeesError(null);
      const response = await get('/employee/getAll');
      setEmployees(Array.isArray(response) ? response : []);
    } catch (err) {
      setEmployeesError(err);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  const loadDetails = useCallback(async () => {
    if (!selectedEmployeeId) {
      return;
    }
    try {
      setLoadingDetails(true);
      setDetailsError(null);
      const response = await get(`/employee/details/${selectedEmployeeId}`);
      if (response && response.salaries) {
        const salaries = [...response.salaries].sort((a, b) =>
          String(b.effectiveFrom || '').localeCompare(String(a.effectiveFrom || '')),
        );
        setEmployeeDetails({ ...response, salaries });
      } else {
        setEmployeeDetails(response);
      }
    } catch (err) {
      setDetailsError(err);
    } finally {
      setLoadingDetails(false);
    }
  }, [selectedEmployeeId]);

  const loadTransactions = useCallback(async () => {
    if (!selectedEmployeeId) {
      return;
    }
    try {
      setLoadingTransactions(true);
      setTransactionsError(null);
      const queryParams = [`employeeId=${selectedEmployeeId}`];
      if (txType) {
        queryParams.push(`type=${txType}`);
      }
      const { startDate, endDate } = toQueryDateRange(range);
      if (startDate) {
        queryParams.push(`startDate=${startDate}`);
      }
      if (endDate) {
        queryParams.push(`endDate=${endDate}`);
      }
      const endpoint = `/salaryTransaction/getAll?${queryParams.join('&')}`;
      const response = await get(endpoint);
      let list = Array.isArray(response) ? response : [];
      list.sort((a, b) =>
        String(b.transactionDate || '').localeCompare(String(a.transactionDate || '')),
      );
      setTransactions(list);
    } catch (err) {
      setTransactionsError(err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [selectedEmployeeId, txType, range]);

  // Refresh employees only while in the selection view. Once the details view
  // is active, the employee list is never re-fetched — so toggling tabs or
  // changing ledger filters (or returning from an add screen) never re-calls
  // GET /employee/getAll.
  useEffect(() => {
    if (isFocused && !isDetailsActive) {
      loadEmployees();
    }
  }, [isFocused, isDetailsActive, loadEmployees]);

// Load employee details (profile + salaries + totalRemainingAmount) on focus
  // or when the selected employee changes. Kept separate from the ledger
  // effect so changing the date/type filter never re-calls the details API.
  useEffect(() => {
    if (isFocused && isDetailsActive && selectedEmployeeId) {
      loadDetails();
    }
  }, [isFocused, isDetailsActive, selectedEmployeeId, loadDetails]);

  // Load the ledger on focus, when the selected employee changes, or when the
  // ledger filters change.
  useEffect(() => {
    if (isFocused && isDetailsActive && selectedEmployeeId) {
      loadTransactions();
    }
  }, [isFocused, isDetailsActive, selectedEmployeeId, loadTransactions]);

  const handleGetDetails = () => {
    if (!selectedEmployeeId) {
      setSelectError('Please select an employee to proceed.');
      return;
    }
    setSelectError(null);
    setIsDetailsActive(true);
    setActiveTab('BASIC');
  };

  const selectedEmployee = employees.find(employee => employee.id === selectedEmployeeId);
  // Prefer the freshly fetched profile from /employee/details/{id}.
  const details = employeeDetails || selectedEmployee;

  const renderBasicDetails = () => {
    if (loadingDetails) {
      return <Loading message="Loading employee details..." />;
    }
    if (detailsError) {
      return (
        <EmptyState
          icon="⚠️"
          title="Couldn't load employee details"
          message={detailsError.message || 'Please try again.'}
          actionLabel="Retry"
          onActionPress={loadDetails}
        />
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <View style={styles.remainingCard}>
          <View style={styles.remainingCardBadge}>
            <Text style={styles.remainingCardBadgeEmoji}>💰</Text>
          </View>
          <View style={styles.remainingCardBody}>
            <Text style={styles.remainingCardLabel}>Total Remaining Amount</Text>
            <Text style={styles.remainingCardValue}>
              {formatCurrency(details?.totalRemainingAmount)}
            </Text>
          </View>
        </View>

        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <DetailRow label="Name" value={details?.name} />
          <DetailRow label="Phone" value={details?.contact} />
          <DetailRow label="Address" value={details?.address} />
        </AppCard>

        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Employment</Text>
          <DetailRow label="Status" value={getEmployeeStatusLabel(details?.status)} />
          <DetailRow
            label="Date of Joining"
            value={formatDateString(details?.dateOfJoining)}
          />
          <DetailRow label="Notes" value={details?.notes || '—'} />
        </AppCard>
      </ScrollView>
    );
  };

  const renderSalaryRow = ({ item }) => (
    <AppCard style={styles.listRow}>
      <View style={styles.listRowLeft}>
        <Text style={styles.amountValue}>{formatCurrency(item.monthlySalary)}</Text>
        <Text style={styles.rowMeta}>
          {formatDateString(item.effectiveFrom)} - {formatDateString(item.effectiveTo)}
        </Text>
      </View>
    </AppCard>
  );

  const renderTransactionRow = ({ item }) => {
    const isCredit = item.type === 'SALARY_CREDIT';
    return (
      <AppCard
        style={[
          styles.listRow,
          isCredit ? styles.creditRow : styles.debitRow,
        ]}
      >
        <View style={styles.listRowLeft}>
          <View style={styles.listRowTopLine}>
            <Text
              style={[styles.rowTitle, isCredit ? styles.creditText : styles.debitText]}
            >
              {getSalaryTransactionTypeLabel(item.type)}
            </Text>
          </View>
          <Text style={styles.rowMeta}>
            {formatDateString(item.transactionDate)} · Month: {item.salaryMonth || '—'}
          </Text>
          {item.notes ? (
            <Text style={styles.rowNotes} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.txAmount, isCredit ? styles.creditAmount : styles.debitAmount]}>
          {formatCurrency(item.amount)}
        </Text>
      </AppCard>
    );
  };

  // Initial view: employee dropdown + Get Details
  if (!isDetailsActive) {
    if (loadingEmployees) {
      return <Loading message="Loading employees..." />;
    }

    if (employeesError) {
      return (
        <EmptyState
          icon="⚠️"
          title="Couldn't load employees"
          message={employeesError.message || 'Please try again.'}
          actionLabel="Retry"
          onActionPress={loadEmployees}
        />
      );
    }

    const employeeOptions = employees.map(employee => ({
      label: `${employee.name}${employee.contact ? ` (${employee.contact})` : ''}`,
      value: employee.id,
    }));

    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.initialContent}
          keyboardShouldPersistTaps="handled"
        >
          <AppCard style={styles.selectionCard}>
            <View style={styles.headerIconRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>👷</Text>
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.pageTitle}>Employee Details</Text>
                <Text style={styles.pageSubtitle}>
                  Select an employee to view details, salaries and salary ledger.
                </Text>
              </View>
            </View>

            <View style={styles.dropdownSection}>
              <AppSelect
                label="Select Employee *"
                placeholder="Choose an employee from list"
                value={selectedEmployeeId}
                options={employeeOptions}
                onSelect={val => {
                  setSelectedEmployeeId(val);
                  setSelectError(null);
                }}
                error={selectError}
              />

              <AppButton
                title="Get Details"
                onPress={handleGetDetails}
                style={styles.getDetailsBtn}
              />

              <View style={styles.addDividerRow}>
                <View style={styles.addDividerLine} />
                <Text style={styles.addDividerText}>or</Text>
                <View style={styles.addDividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [styles.addPartyTile, pressed && styles.addPartyTilePressed]}
                onPress={() => navigation.navigate(EMPLOYEE_ROUTES.ADD_EMPLOYEE)}
                hitSlop={4}
              >
                <View style={styles.addPartyBadge}>
                  <Text style={styles.addPartyBadgeText}>+</Text>
                </View>
                <View style={styles.addPartyTextGroup}>
                  <Text style={styles.addPartyTitle}>Add New Employee</Text>
                  <Text style={styles.addPartySubtitle}>
                    Don't find your employee here? Register a new one.
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

  // Tabbed details view
  return (
    <SafeAreaView style={styles.detailsSafeArea} edges={[]}>
      <View style={styles.detailsHeader}>
        <View style={styles.detailsHeaderBadge}>
          <Text style={styles.detailsHeaderBadgeEmoji}>👷</Text>
        </View>
        <View style={styles.detailsHeaderInfo}>
          <View style={styles.detailsHeaderNameRow}>
            <Text style={styles.detailsHeaderName}>
              {details?.name || 'Employee'}
            </Text>
            <View
              style={[
                styles.statusChip,
                details?.status === false
                  ? styles.statusChipInactive
                  : styles.statusChipActive,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  details?.status === false
                    ? styles.statusChipTextInactive
                    : styles.statusChipTextActive,
                ]}
              >
                {getEmployeeStatusLabel(details?.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.detailsHeaderMeta}>
            📞 {details?.contact || '—'} · 📍 {details?.address || '—'}
          </Text>
          {details?.dateOfJoining ? (
            <Text style={styles.detailsHeaderMeta}>
              📅 Joined {formatDateString(details.dateOfJoining)}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.tabsBar}>
        <View style={styles.segmentedControl}>
          {TABS.map(tab => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.segment, isActive && styles.segmentActive]}
              >
                <Text
                  style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={
          activeTab === 'SALARIES'
            ? details?.salaries || []
            : activeTab === 'LEDGER'
            ? transactions
            : []
        }
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        style={styles.detailsList}
        contentContainerStyle={styles.detailsListContent}
        ListHeaderComponent={
          <>
            {activeTab === 'SALARIES' ? (
              <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>
                  Salary Records ({(details?.salaries || []).length})
                </Text>
                <AppButton
                  title="+ Add Salary"
                  onPress={() =>
                    navigation.navigate(EMPLOYEE_ROUTES.ADD_SALARY, {
                      employeeId: selectedEmployeeId,
                      employeeName: details?.name,
                    })
                  }
                  style={styles.tabHeaderButton}
                />
              </View>
            ) : null}

            {activeTab === 'LEDGER' ? (
              <>
                <AppCard style={styles.filtersCard}>
                  <AppSelect
                    label="Type"
                    placeholder="All Types"
                    value={txType}
                    options={TYPE_FILTER_OPTIONS}
                    onSelect={setTxType}
                    containerStyle={styles.filterSelect}
                  />
                  <Text style={styles.filterLabel}>Date Range</Text>
                  <DateRangeFilter value={range} onChange={setRange} />
                </AppCard>
                <View style={styles.tabHeader}>
                  <Text style={styles.tabHeaderTitle}>
                    Transactions ({transactions.length})
                  </Text>
                  <AppButton
                    title="+ Add Transaction"
                    onPress={() =>
                      navigation.navigate(EMPLOYEE_ROUTES.ADD_SALARY_TRANSACTION, {
                        employeeId: selectedEmployeeId,
                        employeeName: details?.name,
                      })
                    }
                    style={styles.tabHeaderButton}
                  />
                </View>
              </>
            ) : null}
          </>
        }
        renderItem={
          activeTab === 'SALARIES'
            ? renderSalaryRow
            : activeTab === 'LEDGER'
            ? renderTransactionRow
            : null
        }
        ListEmptyComponent={
          activeTab === 'BASIC' ? (
            renderBasicDetails()
          ) : activeTab === 'SALARIES' ? (
            loadingDetails ? (
              <Loading message="Loading salaries..." />
            ) : detailsError ? (
              <EmptyState
                icon="⚠️"
                title="Couldn't load salaries"
                message={detailsError.message || 'Please try again.'}
                actionLabel="Retry"
                onActionPress={loadDetails}
              />
            ) : (details?.salaries || []).length === 0 ? (
              <EmptyState
                icon="💰"
                title="No salaries yet"
                message="Add a salary slab for this employee to get started."
              />
            ) : (
              <EmptyState
                icon="💼"
                title="No salary records"
                message="No salaries are set for this employee."
              />
            )
          ) : loadingTransactions ? (
            <Loading message="Loading transactions..." />
          ) : transactionsError ? (
            <EmptyState
              icon="⚠️"
              title="Couldn't load transactions"
              message={transactionsError.message || 'Please try again.'}
              actionLabel="Retry"
              onActionPress={loadTransactions}
            />
          ) : (
            <EmptyState
              icon="🧾"
              title="No transactions found"
              message="Try a different date range or type, or add a new transaction."
            />
          )
        }
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
  detailsSafeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  detailsHeader: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  detailsHeaderBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailsHeaderBadgeEmoji: {
    fontSize: 28,
  },
  detailsHeaderInfo: {
    flex: 1,
  },
  detailsHeaderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  detailsHeaderName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flexShrink: 1,
  },
  detailsHeaderMeta: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: 15,
  },
  tabsBar: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E9EDEB',
    borderRadius: borderRadius.full,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  segmentLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  segmentLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusChipActive: {
    backgroundColor: colors.white,
  },
  statusChipInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  statusChipTextActive: {
    color: colors.primary,
  },
  statusChipTextInactive: {
    color: colors.danger,
  },
  tabContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  remainingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentTeal,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  remainingCardBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  remainingCardBadgeEmoji: {
    fontSize: 24,
  },
  remainingCardBody: {
    flex: 1,
  },
  remainingCardLabel: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remainingCardValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  detailsList: {
    backgroundColor: colors.background,
  },
  detailsListContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  tabHeaderTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  tabHeaderButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 38,
  },
  filtersCard: {
    marginTop: spacing.lg,
  },
  filterSelect: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listRowLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listRowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: fontWeight.semibold,
    color: '#2563EB',
  },
  creditRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  debitRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  creditText: {
    color: colors.success,
  },
  debitText: {
    color: colors.danger,
  },
  creditBadge: {
    backgroundColor: colors.primaryLight,
  },
  creditBadgeText: {
    color: colors.success,
  },
  debitBadge: {
    backgroundColor: '#FEE2E2',
  },
  debitBadgeText: {
    color: colors.danger,
  },
  creditAmount: {
    color: colors.success,
  },
  debitAmount: {
    color: colors.danger,
  },
  rowMeta: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowNotes: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  txAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.info,
  },
});

export default EmployeeScreen;