/**
 * numberToWords.js
 *
 * Converts a number or numeric string to words in the Indian Numbering System
 * (Lakhs, Crores) formatted for Indian Rupees, matching standard payment invoices.
 *
 * Example:
 *   amountToWords(276.20) -> "Rupees Two Hundred Seventy Six and Twenty Paise Only"
 *   amountToWords(746)    -> "Rupees Seven Hundred Forty Six Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

const convertLessThanThousand = num => {
  if (num === 0) {
    return '';
  }
  let str = '';
  if (num >= 100) {
    str += `${ONES[Math.floor(num / 100)]} Hundred `;
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) {
      str += ONES[num];
    } else {
      str += TENS[Math.floor(num / 10)];
      if (num % 10 > 0) {
        str += ` ${ONES[num % 10]}`;
      }
    }
  }
  return str.trim();
};

export const convertNumberToWords = num => {
  const n = Math.floor(Math.abs(num));
  if (n === 0) {
    return 'Zero';
  }

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  let result = '';

  if (crore > 0) {
    result += `${convertLessThanThousand(crore)} Crore `;
  }
  if (lakh > 0) {
    result += `${convertLessThanThousand(lakh)} Lakh `;
  }
  if (thousand > 0) {
    result += `${convertLessThanThousand(thousand)} Thousand `;
  }
  if (remainder > 0) {
    result += convertLessThanThousand(remainder);
  }

  return result.trim();
};

export const amountToWords = amount => {
  const num = Number(amount);
  if (isNaN(num) || num === 0) {
    return 'Rupees Zero Only';
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const rupeesWord = convertNumberToWords(rupees);
  let result = `Rupees ${rupeesWord}`;

  if (paise > 0) {
    const paiseWord = convertNumberToWords(paise);
    result += ` and ${paiseWord} Paise`;
  }

  result += ' Only';
  return result;
};

export default amountToWords;
