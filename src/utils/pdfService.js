/**
 * pdfService.js
 *
 * Safe, pure JavaScript service for generating, downloading, and sharing PDF bills.
 * Uses purePdfBuilder to generate a 100% standard PDF 1.4 document without any
 * native TurboModule dependencies or native compilation issues.
 */
import { Alert, Share } from 'react-native';
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
    const textReceipt = buildBillTextReceipt(billData);

    // Share PDF Document via system Share dialog (Allows Save to Drive/Files, Print, WhatsApp, etc.)
    await Share.share(
      {
        url: dataUri,
        message: textReceipt,
        title: `Bill_${billData.billNumber}.pdf`,
      },
      {
        dialogTitle: `Download / Share Bill - ${billData.billNumber}`,
        subject: `Payment Bill - ${billData.billNumber}`,
      },
    );
    return { success: true };
  } catch (error) {
    if (error.message !== 'User did not share') {
      Alert.alert('Notice', error.message || 'Could not complete bill export.');
    }
    return { success: false, error };
  }
};

export const shareBillSummary = async billData => {
  try {
    const textReceipt = buildBillTextReceipt(billData);
    const dataUri = generatePdfDataUri(billData);

    await Share.share(
      {
        url: dataUri,
        message: textReceipt,
        title: `Payment Bill - ${billData.billNumber}`,
      },
      {
        dialogTitle: `Share Bill - ${billData.billNumber}`,
        subject: `Payment Bill - ${billData.billNumber}`,
      },
    );
    return { success: true };
  } catch (error) {
    if (error.message !== 'User did not share') {
      Alert.alert('Notice', error.message || 'Could not share bill.');
    }
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
