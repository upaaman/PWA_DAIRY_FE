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

  const partyRole = billData.partyRole || (seller ? 'seller' : 'customer');
  const isSeller = partyRole === 'seller';
  const party = seller || customer;
  const dateField = billData.dateField || (isSeller ? 'purchaseDate' : 'saleDate');
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

  transactions.forEach((purchase, index) => {
    const date = formatDateString(purchase[dateField]) || '—';
    const animalType = purchase.animalType || '—';
    const shift = purchase.shift || '—';
    const quantity = Number(purchase.quantity || 0).toFixed(2);
    const rate = Number(purchase.rate || 0).toFixed(2);
    const amount = Number(purchase.amount || 0).toFixed(2);
    lines.push(
      `${index + 1}. ${date} | ${animalType} (${shift}) | ${quantity} L @ ₹${rate}/L = ₹${amount}`,
    );
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
