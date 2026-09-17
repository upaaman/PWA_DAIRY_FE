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

export const buildBillTextReceipt = billData => {
  const {
    billNumber,
    billDate = new Date(),
    startDate,
    endDate,
    seller,
    purchases = [],
    totalQuantity = 0,
    totalAmount = 0,
  } = billData;

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
    `*AKKU DADA DAIRY - PAYMENT BILL*`,
    `Healthy Animals | Fresh Milk | Better Tomorrow`,
    `Bagicha Farm, Gram Khurshipar 487551`,
    `Ph: +91 9752248080 | info@akkudadadairy.in`,
    `----------------------------------------`,
    `*Bill No*   : ${billNumber}`,
    `*Bill Date* : ${formattedBillDate}`,
    `*Period*    : ${formattedStartDate} to ${formattedEndDate}`,
    `----------------------------------------`,
    `*SELLER DETAILS*`,
    `Name    : ${seller?.name || '—'}`,
    `Contact : ${seller?.contact || '—'}`,
    `Address : ${seller?.address || '—'}`,
    `----------------------------------------`,
    `*PURCHASE DETAILS*`,
  ];

  purchases.forEach((p, idx) => {
    const d = formatDateString(p.purchaseDate) || '—';
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
  lines.push(`- Akku Dada Dairy`);

  return lines.join('\n');
};

export const printOrDownloadBill = async billData => {
  try {
    const dataUri = generatePdfDataUri(billData);
    const filename = `Bill_${billData.billNumber}`;

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
      title: `Download / Share Bill - ${billData.billNumber}`,
      subject: `Payment Bill - ${billData.billNumber}`,
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
    const filename = `Bill_${billData.billNumber}`;
    const textReceipt = buildBillTextReceipt(billData);

    const result = await Share.open({
      url: dataUri,
      type: 'application/pdf',
      filename,
      message: textReceipt,
      title: `Share Bill - ${billData.billNumber}`,
      subject: `Payment Bill - ${billData.billNumber}`,
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
