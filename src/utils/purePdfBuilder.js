/**
 * purePdfBuilder.js
 *
 * Pure JavaScript PDF generator that builds standard PDF 1.4 binary documents
 * with zero native dependencies or external packages.
 *
 * Generates high-fidelity payment bills matching the Akku Dada Dairy design.
 */
import { formatDateString } from './date';
import { amountToWords } from './numberToWords';

// Base64 encoding helper for pure JS environments
const btoa = input => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = String(input);
  let output = '';

  for (
    let block = 0, charCode, idx = 0, map = chars;
    str.charAt(idx | 0) || ((map = '='), idx % 1);
    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
  ) {
    charCode = str.charCodeAt((idx += 3 / 4));
    if (charCode > 0xff) {
      // sanitize non-latin1 characters
      charCode = 32;
    }
    block = (block << 8) | charCode;
  }
  return output;
};

// Escape text for PDF text stream
const escapePdfText = str => {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' '); // Keep safe ASCII
};

export const generatePdfBase64 = billData => {
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
  const words = amountToWords(totalAmount).replace(/[₹]/g, 'Rs ');

  // A4 dimensions in points: 595.28 x 841.89
  const ops = [];

  // Helper drawing functions
  const setFillColor = (r, g, b) => ops.push(`${r} ${g} ${b} rg`);
  const setStrokeColor = (r, g, b) => ops.push(`${r} ${g} ${b} RG`);
  const setLineWidth = w => ops.push(`${w} w`);
  const drawRect = (x, y, w, h, fill = true, stroke = false) => {
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fill && stroke) ops.push('B');
    else if (fill) ops.push('f');
    else if (stroke) ops.push('S');
  };
  const drawLine = (x1, y1, x2, y2) => {
    ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };
  const drawText = (font, size, x, y, text, r = 0.06, g = 0.09, b = 0.16) => {
    setFillColor(r, g, b);
    ops.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`);
  };

  // 1. Header: Akku Dada Dairy Logo & Brand
  // Green header accent line
  setStrokeColor(0.122, 0.427, 0.243); // #1F6D3E
  setLineWidth(2);
  drawLine(36, 750, 559, 750);

  // Logo circle badge
  setFillColor(0.906, 0.961, 0.925); // #E7F5EC
  setStrokeColor(0.122, 0.427, 0.243);
  drawRect(36, 756, 42, 42, true, true);
  drawText('F2', 12, 44, 772, 'ADD', 0.122, 0.427, 0.243);

  // Brand text
  drawText('F2', 20, 86, 782, 'Akku Dada Dairy', 0.075, 0.306, 0.180); // #134e2e
  drawText('F3', 8.5, 86, 768, 'Healthy Animals | Fresh Milk | Better Tomorrow', 0.122, 0.427, 0.243);

  // Contact Info (Right aligned)
  drawText('F1', 8, 370, 792, 'Bagicha Farm , Gram Khurshipar 487551', 0.278, 0.333, 0.412);
  drawText('F1', 8, 435, 778, '+91 9752248080', 0.278, 0.333, 0.412);
  drawText('F1', 8, 410, 764, 'info@akkudadadairy.in', 0.278, 0.333, 0.412);

  // 2. Title & Bill Metadata
  drawText('F2', 24, 36, 712, 'Payment Bill', 0.118, 0.227, 0.541); // #1e3a8a
  drawText('F1', 11, 36, 696, '(To be paid to Seller)', 0.278, 0.333, 0.412);

  // Metadata Box (Right)
  setFillColor(0.973, 0.980, 0.988);
  setStrokeColor(0.749, 0.859, 0.996); // #bfdbfe
  setLineWidth(1);
  drawRect(350, 680, 209, 52, true, true);

  // Divider lines inside Meta Box
  drawLine(350, 715, 559, 715);
  drawLine(350, 698, 559, 698);
  drawLine(410, 680, 410, 732);

  drawText('F2', 8, 355, 720, 'Bill No.', 0.118, 0.227, 0.541);
  drawText('F2', 8, 416, 720, billNumber, 0.059, 0.090, 0.165);

  drawText('F2', 8, 355, 703, 'Bill Date', 0.118, 0.227, 0.541);
  drawText('F1', 8, 416, 703, formattedBillDate, 0.059, 0.090, 0.165);

  drawText('F2', 8, 355, 686, 'Period', 0.118, 0.227, 0.541);
  drawText('F1', 8, 416, 686, `${formattedStartDate} - ${formattedEndDate}`, 0.059, 0.090, 0.165);

  // 3. Seller Details Box
  setFillColor(0.937, 0.965, 1.0); // #eff6ff
  drawRect(36, 652, 523, 18, true, false);
  drawText('F2', 9.5, 42, 657, 'Seller Details', 0.118, 0.227, 0.541);

  drawText('F2', 9, 42, 636, 'Name', 0.278, 0.333, 0.412);
  drawText('F1', 9, 85, 636, `: ${seller?.name || '—'}`, 0.059, 0.090, 0.165);

  drawText('F2', 9, 42, 622, 'Contact', 0.278, 0.333, 0.412);
  drawText('F1', 9, 85, 622, `: ${seller?.contact || '—'}`, 0.059, 0.090, 0.165);

  drawText('F2', 9, 42, 608, 'Address', 0.278, 0.333, 0.412);
  drawText('F1', 9, 85, 608, `: ${seller?.address || '—'}`, 0.059, 0.090, 0.165);

  // 4. Purchase Transactions Table
  let currentY = 582;
  const colX = [36, 62, 135, 215, 290, 375, 460, 559];

  // Table Header Bar (Dark Blue)
  setFillColor(0.145, 0.388, 0.922); // #2563eb
  drawRect(36, currentY, 523, 20, true, false);

  drawText('F2', 8.5, 42, currentY + 6, 'No.', 1, 1, 1);
  drawText('F2', 8.5, 80, currentY + 6, 'Date', 1, 1, 1);
  drawText('F2', 8.5, 150, currentY + 6, 'Animal Type', 1, 1, 1);
  drawText('F2', 8.5, 235, currentY + 6, 'Shift', 1, 1, 1);
  drawText('F2', 8.5, 305, currentY + 6, 'Qty (Litres)', 1, 1, 1);
  drawText('F2', 8.5, 395, currentY + 6, 'Rate (Rs/L)', 1, 1, 1);
  drawText('F2', 8.5, 485, currentY + 6, 'Amount (Rs)', 1, 1, 1);

  currentY -= 18;

  // Table Rows
  purchases.forEach((p, idx) => {
    if (idx % 2 === 1) {
      setFillColor(0.973, 0.980, 0.988);
      drawRect(36, currentY, 523, 18, true, false);
    }
    setStrokeColor(0.886, 0.910, 0.941); // #e2e8f0
    drawLine(36, currentY, 559, currentY);

    const d = formatDateString(p.purchaseDate) || '—';
    const a = p.animalType || '—';
    const s = p.shift || '—';
    const q = Number(p.quantity || 0).toFixed(2);
    const r = Number(p.rate || 0).toFixed(2);
    const amt = Number(p.amount || 0).toFixed(2);

    drawText('F1', 8, 45, currentY + 5, String(idx + 1));
    drawText('F1', 8, 75, currentY + 5, d);
    drawText('F1', 8, 155, currentY + 5, a);
    drawText('F1', 8, 235, currentY + 5, s);
    drawText('F1', 8, 320, currentY + 5, q);
    drawText('F1', 8, 405, currentY + 5, r);
    drawText('F2', 8.5, 495, currentY + 5, amt);

    currentY -= 18;
  });

  // Table Total Row
  setFillColor(0.937, 0.965, 1.0); // #eff6ff
  setStrokeColor(0.749, 0.859, 0.996);
  drawRect(36, currentY, 523, 20, true, true);

  drawText('F2', 9, 230, currentY + 6, 'Total Amount', 0.118, 0.227, 0.541);
  drawText('F2', 9, 318, currentY + 6, `${Number(totalQuantity).toFixed(2)} L`, 0.118, 0.227, 0.541);
  drawText('F2', 10, 485, currentY + 6, `Rs ${Number(totalAmount).toFixed(2)}`, 0.118, 0.227, 0.541);

  currentY -= 30;

  // 5. Summary & Payment Details Grid
  // Left: Amount to be paid card
  setFillColor(0.941, 0.976, 1.0); // #f0f9ff
  setStrokeColor(0.729, 0.902, 0.992); // #bae6fd
  drawRect(36, currentY - 55, 240, 68, true, true);

  drawText('F2', 9.5, 46, currentY + 2, 'Amount to be Paid', 0.012, 0.412, 0.631);
  drawText('F2', 18, 46, currentY - 18, `Rs ${Number(totalAmount).toFixed(2)}`, 0.047, 0.290, 0.431);
  drawText('F1', 7.5, 46, currentY - 34, `(${words.substring(0, 45)})`, 0.008, 0.518, 0.780);
  if (words.length > 45) {
    drawText('F1', 7.5, 46, currentY - 44, `(${words.substring(45)})`, 0.008, 0.518, 0.780);
  }

  // Right: Payment details card
  setFillColor(0.973, 0.980, 0.988);
  setStrokeColor(0.886, 0.910, 0.941);
  drawRect(290, currentY - 55, 269, 68, true, true);

  setFillColor(0.878, 0.949, 0.996);
  drawRect(290, currentY - 2, 269, 15, true, false);
  drawText('F2', 9, 298, currentY + 2, 'Payment Details', 0.012, 0.412, 0.631);

  drawText('F2', 8, 298, currentY - 18, 'Payment Mode', 0.392, 0.455, 0.545);
  drawText('F1', 8, 365, currentY - 18, ': Cash / Bank Transfer', 0.059, 0.090, 0.165);

  drawText('F2', 8, 298, currentY - 32, 'Due Date', 0.392, 0.455, 0.545);
  drawText('F1', 8, 365, currentY - 32, `: ${formattedBillDate}`, 0.059, 0.090, 0.165);

  drawText('F2', 8, 298, currentY - 46, 'Remarks', 0.392, 0.455, 0.545);
  drawText('F1', 8, 365, currentY - 46, `: Milk Purchase (${formattedStartDate} - ${formattedEndDate})`, 0.059, 0.090, 0.165);

  currentY -= 80;

  // 6. Footer & Signature
  setStrokeColor(0.796, 0.835, 0.882);
  drawLine(36, currentY, 559, currentY);

  drawText('F3', 10, 36, currentY - 18, 'Thank you for your continued support!', 0.075, 0.306, 0.180);
  drawText('F1', 8, 36, currentY - 30, 'Your contribution helps us deliver fresh and quality dairy products.', 0.278, 0.333, 0.412);

  // Signature line
  setStrokeColor(0.200, 0.255, 0.333);
  drawLine(430, currentY - 26, 550, currentY - 26);
  drawText('F2', 8, 442, currentY - 36, 'Authorized Signature', 0.059, 0.090, 0.165);
  drawText('F1', 7.5, 452, currentY - 46, 'Akku Dada Dairy', 0.392, 0.455, 0.545);

  // Decorative green bottom stripe
  setFillColor(0.122, 0.427, 0.243);
  drawRect(36, currentY - 58, 523, 6, true, false);

  // Construct PDF Objects
  const streamContent = ops.join('\n');
  const streamLength = streamContent.length;

  const objects = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`;
  objects[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>`;
  objects[4] = `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`;
  objects[5] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[6] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;
  objects[7] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>`;

  let pdfString = '%PDF-1.4\n';
  const offsets = [];

  for (let i = 1; i <= 7; i++) {
    offsets[i] = pdfString.length;
    pdfString += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdfString.length;
  pdfString += 'xref\n0 8\n0000000000 65535 f \n';
  for (let i = 1; i <= 7; i++) {
    pdfString += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdfString += `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return btoa(pdfString);
};

export const generatePdfDataUri = billData => {
  const base64 = generatePdfBase64(billData);
  return `data:application/pdf;base64,${base64}`;
};

export default {
  generatePdfBase64,
  generatePdfDataUri,
};
