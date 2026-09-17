/**
 * BillPreviewModal.js
 *
 * Modal that renders the complete payment bill invoice inside the app,
 * matching the reference design:
 * - Dairy header & branding
 * - Meta info (Bill No, Bill Date, Start/End Date)
 * - Seller details
 * - Table of milk purchases
 * - Amount to be paid & words
 * - Payment details & sign-off
 * - Action buttons to Download / Print PDF & Share.
 */
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppButton from './AppButton';
import colors from '../constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '../constants/appConstants';
import { formatDateString } from '../utils/date';
import { formatCurrency, formatLiters } from '../utils/format';
import { amountToWords } from '../utils/numberToWords';

const BillPreviewModal = ({
  visible,
  onClose,
  billData,
  onPrintOrDownload,
  onShare,
  isExporting,
}) => {
  if (!billData) {
    return null;
  }

  const {
    billNumber,
    billDate = new Date(),
    startDate,
    endDate,
    seller,
    customer,
    purchases,
    sales,
    totalQuantity = 0,
    totalAmount = 0,
  } = billData;

  // Generic "party" support — see purePdfBuilder.js for the full
  // explanation. Seller bill = money we pay out; Customer bill = money
  // owed to us. Both entities share the same { name, contact, address }
  // shape, so only labels/wording differ between the two.
  const partyRole = billData.partyRole || (seller ? 'seller' : 'customer');
  const isSeller = partyRole === 'seller';
  const party = seller || customer;
  const transactions = purchases || sales || [];
  const dateField = billData.dateField || (isSeller ? 'purchaseDate' : 'saleDate');

  const previewTitle = isSeller ? 'Payment Bill Preview' : 'Sales Invoice Preview';
  const billTitleText = isSeller ? 'Payment Bill' : 'Sales Invoice';
  const billSubtitleText = isSeller ? '(To be paid to Seller)' : '(To be paid by Customer)';
  const partyLabel = isSeller ? 'Seller Details' : 'Buyer Details';
  const amountCardTitle = isSeller ? 'Amount to be Paid' : 'Amount Receivable';
  const remarksLabel = isSeller ? 'Milk Purchase' : 'Milk Sale';

  const formattedBillDate =
    typeof billDate === 'string'
      ? formatDateString(billDate)
      : billDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

  const words = amountToWords(totalAmount);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topBarTitle}>{previewTitle}</Text>
              <Text style={styles.topBarSubtitle}>Invoice #{billNumber}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Scrollable Bill Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.billCard}>
              {/* Dairy Header */}
              <View style={styles.dairyHeader}>
                <View style={styles.brandRow}>
                  <View style={styles.brandLogo}>
                    <Text style={styles.brandLogoEmoji}>🐄</Text>
                  </View>
                  <View>
                    <Text style={styles.brandName}>Akku Dada Dairy</Text>
                    <Text style={styles.brandSlogan}>
                      Healthy Animals | Fresh Milk | Better Tomorrow
                    </Text>
                  </View>
                </View>

                <View style={styles.dairyContact}>
                  <Text style={styles.contactLine}>📍 Bagicha Farm , Gram Khurshipar 487551</Text>
                  <Text style={styles.contactLine}>📞 +91 9752248080</Text>
                  <Text style={styles.contactLine}>✉️ info@akkudadadairy.in</Text>
                </View>
              </View>

              <View style={styles.greenDivider} />

              {/* Title & Meta Row */}
              <View style={styles.titleMetaRow}>
                <View>
                  <Text style={styles.billHeading}>{billTitleText}</Text>
                  <Text style={styles.billSubheading}>{billSubtitleText}</Text>
                </View>

                <View style={styles.metaTable}>
                  <View style={styles.metaTableRow}>
                    <Text style={styles.metaLabel}>Bill No.</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>{billNumber}</Text>
                  </View>
                  <View style={styles.metaTableRow}>
                    <Text style={styles.metaLabel}>Bill Date</Text>
                    <Text style={styles.metaValue}>{formattedBillDate}</Text>
                  </View>
                  <View style={[styles.metaTableRow, styles.noBottomBorder]}>
                    <Text style={styles.metaLabel}>Period</Text>
                    <Text style={styles.metaValue}>
                      {formatDateString(startDate)} - {formatDateString(endDate)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Party Details (Seller or Buyer) */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{partyLabel}</Text>
              </View>
              <View style={styles.sellerInfoTable}>
                <View style={styles.sellerRow}>
                  <Text style={styles.sellerKey}>Name</Text>
                  <Text style={styles.sellerColon}>:</Text>
                  <Text style={styles.sellerVal}>{party?.name || '—'}</Text>
                </View>
                <View style={styles.sellerRow}>
                  <Text style={styles.sellerKey}>Contact</Text>
                  <Text style={styles.sellerColon}>:</Text>
                  <Text style={styles.sellerVal}>{party?.contact || '—'}</Text>
                </View>
                <View style={styles.sellerRow}>
                  <Text style={styles.sellerKey}>Address</Text>
                  <Text style={styles.sellerColon}>:</Text>
                  <Text style={styles.sellerVal}>{party?.address || '—'}</Text>
                </View>
              </View>

              {/* Items Table */}
              <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, styles.colNo]}>No.</Text>
                  <Text style={[styles.th, styles.colDate]}>Date</Text>
                  <Text style={[styles.th, styles.colType]}>Animal</Text>
                  <Text style={[styles.th, styles.colShift]}>Shift</Text>
                  <Text style={[styles.th, styles.colQty]}>Qty (L)</Text>
                  <Text style={[styles.th, styles.colRate]}>Rate</Text>
                  <Text style={[styles.th, styles.colAmt]}>Amount</Text>
                </View>

                {/* Rows */}
                {transactions.length === 0 ? (
                  <View style={styles.emptyTableRow}>
                    <Text style={styles.emptyTableText}>No records found.</Text>
                  </View>
                ) : (
                  transactions.map((item, index) => (
                    <View
                      key={item.id || index}
                      style={[
                        styles.tableDataRow,
                        index % 2 === 1 && styles.tableDataRowAlt,
                      ]}
                    >
                      <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>
                      <Text style={[styles.td, styles.colDate]}>
                        {formatDateString(item[dateField]) || '—'}
                      </Text>
                      <Text style={[styles.td, styles.colType]}>{item.animalType || '—'}</Text>
                      <Text style={[styles.td, styles.colShift]}>{item.shift || '—'}</Text>
                      <Text style={[styles.td, styles.colQty]}>
                        {Number(item.quantity || 0).toFixed(1)}
                      </Text>
                      <Text style={[styles.td, styles.colRate]}>
                        {Number(item.rate || 0).toFixed(0)}
                      </Text>
                      <Text style={[styles.td, styles.colAmt, styles.boldText]}>
                        {Number(item.amount || 0).toFixed(0)}
                      </Text>
                    </View>
                  ))
                )}

                {/* Total Row */}
                <View style={styles.tableTotalRow}>
                  <Text style={[styles.totalLabel]}>Total Amount</Text>
                  <Text style={[styles.totalQty]}>{formatLiters(totalQuantity)}</Text>
                  <Text style={[styles.totalAmt]}>{formatCurrency(totalAmount)}</Text>
                </View>
              </View>

              {/* Bottom Summary Cards */}
              <View style={styles.bottomSummary}>
                {/* Amount to be Paid / Receivable */}
                <View style={styles.amountPaidCard}>
                  <Text style={styles.amountPaidTitle}>{amountCardTitle}</Text>
                  <Text style={styles.amountPaidValue}>{formatCurrency(totalAmount)}</Text>
                  <Text style={styles.amountPaidWords}>({words})</Text>
                </View>

                {/* Payment Details */}
                <View style={styles.paymentDetailsCard}>
                  <View style={styles.paymentCardHeader}>
                    <Text style={styles.paymentCardHeaderText}>Payment Details</Text>
                  </View>
                  <View style={styles.paymentCardBody}>
                    <View style={styles.payRow}>
                      <Text style={styles.payKey}>Payment Mode</Text>
                      <Text style={styles.payVal}>: Cash / Bank Transfer</Text>
                    </View>
                    <View style={styles.payRow}>
                      <Text style={styles.payKey}>Due Date</Text>
                      <Text style={styles.payVal}>: {formattedBillDate}</Text>
                    </View>
                    <View style={styles.payRow}>
                      <Text style={styles.payKey}>Remarks</Text>
                      <Text style={styles.payVal}>: {remarksLabel}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Footer Sign-off */}
              <View style={styles.billFooter}>
                <View style={styles.thankyouBlock}>
                  <Text style={styles.thankyouHeading}>Thank you for your support!</Text>
                  <Text style={styles.thankyouDesc}>
                    Your contribution helps us deliver fresh and quality dairy products.
                  </Text>
                </View>

                <View style={styles.signBlock}>
                  <Text style={styles.signatureScript}>Akku Dada</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureTitle}>Authorized Signature</Text>
                  <Text style={styles.signatureOrg}>Akku Dada Dairy</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.actionsBar}>
            <AppButton
              title="Share Bill"
              variant="outline"
              onPress={onShare}
              style={styles.actionBtn}
            />
            <AppButton
              title="Download / Print PDF"
              onPress={onPrintOrDownload}
              loading={isExporting}
              style={[styles.actionBtn, styles.printBtn]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxHeight: '92%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  topBarSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.bold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  billCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dairyHeader: {
    marginBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  brandLogoEmoji: {
    fontSize: 22,
  },
  brandName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  brandSlogan: {
    fontSize: 9.5,
    fontStyle: 'italic',
    color: colors.primaryDark,
  },
  dairyContact: {
    marginTop: spacing.xs,
  },
  contactLine: {
    fontSize: 10.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  greenDivider: {
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: spacing.sm,
  },
  titleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  billHeading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
  },
  billSubheading: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaTable: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: borderRadius.sm,
    backgroundColor: '#F8FAFC',
    width: 155,
    overflow: 'hidden',
  },
  metaTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  noBottomBorder: {
    borderBottomWidth: 0,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
    width: 50,
  },
  metaValue: {
    fontSize: 9.5,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    marginBottom: spacing.xs,
  },
  sectionHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
  },
  sellerInfoTable: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  sellerKey: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    width: 60,
  },
  sellerColon: {
    fontSize: 11,
    color: colors.textSecondary,
    width: 12,
  },
  sellerVal: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  th: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: 10,
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  tableDataRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  td: {
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
  },
  colNo: { width: 24 },
  colDate: { width: 68 },
  colType: { width: 50 },
  colShift: { width: 45 },
  colQty: { width: 38 },
  colRate: { width: 32 },
  colAmt: { flex: 1, textAlign: 'right', paddingRight: 4 },
  boldText: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptyTableRow: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
  },
  totalQty: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
  },
  totalAmt: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
  },
  bottomSummary: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  amountPaidCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  amountPaidTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#0369A1',
  },
  amountPaidValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#0C4A6E',
    marginVertical: 2,
  },
  amountPaidWords: {
    fontSize: 10.5,
    color: '#0284C7',
    fontWeight: fontWeight.medium,
  },
  paymentDetailsCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  paymentCardHeader: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  paymentCardHeaderText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#0369A1',
  },
  paymentCardBody: {
    padding: spacing.sm,
  },
  payRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  payKey: {
    fontSize: 10.5,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    width: 85,
  },
  payVal: {
    fontSize: 10.5,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  thankyouBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  thankyouHeading: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    fontStyle: 'italic',
    color: colors.primary,
  },
  thankyouDesc: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  signBlock: {
    alignItems: 'center',
    width: 110,
  },
  signatureScript: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: fontWeight.bold,
    color: '#1E3A8A',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
  },
  signatureLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#334155',
    marginVertical: 2,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  signatureOrg: {
    fontSize: 8.5,
    color: colors.textSecondary,
  },
  actionsBar: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  printBtn: {
    backgroundColor: colors.primary,
  },
});

export default BillPreviewModal;
