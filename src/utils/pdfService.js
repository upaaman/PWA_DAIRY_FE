/**
 * pdfService.js
 *
 * Safe, pure JavaScript service for generating, downloading, and sharing PDF bills.
 * Uses purePdfBuilder to generate a 100% standard PDF 1.4 document without any
 * native TurboModule dependencies or native compilation issues.
 *
 * IMPORTANT: React Native's built-in `Share` API cannot attach a file on
 * Android — its `url` field is iOS-only; on Android only `message` (plain
 * text) is ever sent, which is why "Download / Print PDF" was silently
 * falling back to a text-only share sheet. There is no pure-JS fix for
 * this — Android requires a real file (via a FileProvider content:// URI)
 * to open the "Save/Print/WhatsApp" style share sheet with an actual PDF
 * attachment. We use `react-native-share`, which:
 *   - accepts our existing base64 PDF data URI directly,
 *   - decodes it and writes a real temp file itself,
 *   - wraps it in a proper FileProvider URI on Android automatically
 *     (see its bundled AndroidManifest.xml / share_download_paths.xml),
 *   - and works the same way on iOS.
 */
import { Alert } from 'react-native';
import Share from 'react-native-share';
import { generatePdfDataUri, generatePdfBase64 } from './purePdfBuilder';
import { formatDateString } from './date';
import { amountToWords } from './numberToWords';
import { BRAND, BRAND_PHONE_LINE } from '../constants/brand';
import { sortBillTransactions } from './billTransactions';

export const buildBillTextReceipt = billData => {
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

  // See purePdfBuilder.js for the same generic seller/customer handling.
  const partyRole = billData.partyRole || (seller ? 'seller' : 'customer');
  const isSeller = partyRole === 'seller';
  const party = seller || customer;
  const dateField = billData.dateField || (isSeller ? 'purchaseDate' : 'saleDate');
  // Oldest → newest, like the PDF.
  const transactions = sortBillTransactions(purchases || sales || [], dateField);

  const headingLabel = isSeller ? 'PAYMENT BILL' : 'SALES INVOICE';
  const partyLabel = isSeller ? 'SELLER DETAILS' : 'CUSTOMER DETAILS';
  const transactionsLabel = isSeller ? 'PURCHASE DETAILS' : 'SALE DETAILS';

  const formattedBillDate =
    typeof billDate === 'string'
      ? formatDateString(billDate)
      : billDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

  const formattedStartDate = startDate ? formatDateString(startDate) : '—';
  const formattedEndDate = endDate ? formatDateString(endDate) : '—';
  const words = amountToWords(totalAmount);

  const lines = [
    `*${BRAND.name.toUpperCase()} - ${headingLabel}*`,
    BRAND.tagline,
    BRAND.address,
    `Ph: ${BRAND_PHONE_LINE} | ${BRAND.email}`,
    `----------------------------------------`,
    `*Bill No*   : ${billNumber}`,
    `*Bill Date* : ${formattedBillDate}`,
    `*Period*    : ${formattedStartDate} to ${formattedEndDate}`,
    `----------------------------------------`,
    `*${partyLabel}*`,
    `Name    : ${party?.name || '—'}`,
    `Contact : ${party?.contact || '—'}`,
    `Address : ${party?.address || '—'}`,
    `----------------------------------------`,
    `*${transactionsLabel}*`,
  ];

  transactions.forEach((p, idx) => {
    const d = formatDateString(p[dateField]) || '—';
    const a = p.animalType || '—';
    const s = p.shift || '—';
    const q = Number(p.quantity || 0).toFixed(2);
    const r = Number(p.rate || 0).toFixed(2);
    const amt = Number(p.amount || 0).toFixed(2);
    lines.push(`${idx + 1}. ${d} | ${a} (${s}) | ${q} L @ ₹${r}/L = ₹${amt}`);
  });

  lines.push(`----------------------------------------`);
  lines.push(`*Total Milk*   : ${Number(totalQuantity).toFixed(2)} L`);
  lines.push(`*TOTAL AMOUNT* : ₹${Number(totalAmount).toFixed(2)}`);
  lines.push(`*In Words*     : ${words}`);
  lines.push(`*Payment Mode* : Cash / Bank Transfer`);
  lines.push(`----------------------------------------`);
  lines.push(`Thank you for your continued support!`);
  lines.push(`- ${BRAND.name}`);

  return lines.join('\n');
};

/**
 * Builds the export filename: "Sale_<customerName>_<start>_<end>" for a
 * customer bill, "Purchase_<sellerName>_<start>_<end>" for a seller bill.
 * `billNumber` is already "<name>_<start>_<end>" (see Seller/CustomerScreen),
 * so this just prefixes it with the right word instead of the generic "Bill_".
 */
const getBillFilename = billData => {
  const isSeller = (billData.partyRole || (billData.seller ? 'seller' : 'customer')) === 'seller';
  const prefix = isSeller ? 'Purchase' : 'Sale';
  return `${prefix}_${billData.billNumber}`;
};

export const printOrDownloadBill = async billData => {
  try {
    const dataUri = generatePdfDataUri(billData);
    const filename = getBillFilename(billData);

    // Share.open with a real file attachment (via react-native-share) —
    // this is what actually gives the "Save to Drive/Files, Print,
    // WhatsApp, etc." options. The old RN-core Share.share() call here
    // only ever sent plain text on Android.
    //
    // With failOnCancel: false, react-native-share RESOLVES (doesn't
    // throw) when the user dismisses the sheet — it comes back as
    // `{ success: false, dismissedAction: true }` rather than rejecting,
    // so we check `result.success` instead of relying on a catch block
    // for cancellation (unlike RN core's old Share.share()).
    //
    // useInternalStorage: true is required — without it, the library
    // writes the temp file to getExternalCacheDir(), which is NOT
    // covered by its own bundled FileProvider <paths> config (only
    // internal getCacheDir() is), causing a native crash:
    // "Failed to find configured root that contains ...".
    const result = await Share.open({
      url: dataUri,
      type: 'application/pdf',
      filename,
      title: `Download / Share - ${filename}`,
      subject: filename,
      saveToFiles: true,
      failOnCancel: false,
      useInternalStorage: true,
    });
    return { success: result?.success !== false };
  } catch (error) {
    Alert.alert('Notice', error.message || 'Could not complete bill export.');
    return { success: false, error };
  }
};

export const shareBillSummary = async billData => {
  try {
    const dataUri = generatePdfDataUri(billData);
    const filename = getBillFilename(billData);
    const textReceipt = buildBillTextReceipt(billData);

    const result = await Share.open({
      url: dataUri,
      type: 'application/pdf',
      filename,
      message: textReceipt,
      title: `Share - ${filename}`,
      subject: filename,
      failOnCancel: false,
      useInternalStorage: true,
    });
    return { success: result?.success !== false };
  } catch (error) {
    Alert.alert('Notice', error.message || 'Could not share bill.');
    return { success: false, error };
  }
};

export const createPdfFile = async billData => {
  const base64 = generatePdfBase64(billData);
  return { success: true, base64, dataUri: `data:application/pdf;base64,${base64}` };
};

export default {
  buildBillTextReceipt,
  printOrDownloadBill,
  shareBillSummary,
  createPdfFile,
};
