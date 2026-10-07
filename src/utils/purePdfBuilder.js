/**
 * purePdfBuilder.js
 *
 * Pure JavaScript PDF generator that builds standard PDF 1.4 binary documents
 * with zero native dependencies or external packages.
 *
 * Generates high-fidelity payment bills for EiiE Dairyfarm, complete with the
 * real logo in the header and the dairy seal above the sign-off
 * line. The artwork is embedded as image XObjects; the pixel data ships
 * pre-deflated in src/assets/billBrandImages.js (see
 * scripts/buildBillBrandAssets.js) so nothing has to be compressed here.
 *
 * Supports multiple pages: the transaction table automatically flows onto
 * additional pages when it doesn't fit on one, each continuation page gets
 * a slim repeated header + the table header row again, and the totals /
 * amount-due / footer block is only drawn once space for it is actually
 * available (pushing it onto a fresh page if the current one is full).
 */
import { formatDateString } from './date';
import { amountToWords } from './numberToWords';
import { BRAND, BRAND_CONTACT_LINES } from '../constants/brand';
import BRAND_IMAGES from '../assets/billBrandImages';
import { sortBillTransactions } from './billTransactions';
import { base64ToBinaryString } from './pdfImage';
import { measurePdfText } from './pdfText';

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

// A4 dimensions in points: 595.28 x 841.89
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const BOTTOM_MARGIN = 40;
const ROW_HEIGHT = 18;
const FIRST_PAGE_TABLE_START_Y = 582;
const CONTINUATION_TABLE_START_Y = 770;
// Space reserved for the Total row + Amount/Payment summary cards +
// footer/seal block (see the footer code below).
const FOOTER_BLOCK_HEIGHT = 250;
// Right edge of the printable area — the brand block is right-aligned to it.
const CONTENT_RIGHT = 559;

// The brand artwork, decoded on first use. `decoded` is the raw zlib
// stream the PDF hands straight to the viewer; `width`/`height` are the
// pixel dimensions used for the aspect ratio. Decoding is memoised so the
// ~60 KB payload is only turned into bytes when a bill is actually built.
const artworkCache = {};

const getArtwork = key => {
  if (artworkCache[key] === undefined) {
    const image = BRAND_IMAGES[key];
    artworkCache[key] = image ? { ...image, decoded: base64ToBinaryString(image.data) } : null;
  }
  return artworkCache[key];
};

// Rendered height of the logo in the header (points). Width follows from
// the source aspect ratio.
const LOGO_HEIGHT = 40;
const CONTINUATION_LOGO_HEIGHT = 18;
// Rendered height of the dairy seal sitting above the sign-off line.
const SEAL_HEIGHT = 56;

/**
 * Image XObject dictionary for a pre-deflated 8-bit RGB image.
 *
 * `/Predictor 15` tells the reader the inflated data is PNG-row-filtered
 * (see scripts/buildBillBrandAssets.js) so it undoes the filtering after
 * inflating. Declaring the filter means the device never has to compress
 * anything itself.
 */
const imageXObjectDict = image =>
  `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
  `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode ` +
  `/DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns ${image.width} >> ` +
  `/Length ${image.decoded.length} >>`;

export const generatePdfBase64 = billData => {
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

  // Generic "party" support: a Seller bill (money we pay out, purchases
  // from a seller) vs a Customer bill (money owed to us, sales to a
  // customer). Both Seller/Customer entities share the same shape
  // ({ name, contact, address }), so only the labels/wording differ.
  const partyRole = billData.partyRole || (seller ? 'seller' : 'customer');
  const isSeller = partyRole === 'seller';
  const party = seller || customer;
  const dateField = billData.dateField || (isSeller ? 'purchaseDate' : 'saleDate');
  // Bills always read oldest → newest (01 → 30), independent of the order
  // the calling screen listed the records in.
  const transactions = sortBillTransactions(purchases || sales || [], dateField);

  const billTitle = isSeller ? 'Payment Bill' : 'Sales Invoice';
  const billSubtitle = isSeller ? '(To be paid to Seller)' : '(To be paid by Customer)';
  const partyLabel = isSeller ? 'Seller Details' : 'Customer Details';
  const amountCardLabel = isSeller ? 'Amount to be Paid' : 'Amount Receivable';
  const remarksLabel = isSeller ? 'Milk Purchase' : 'Milk Sale';

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

  // `ops` holds the current page's content stream operators. Drawing
  // helpers below close over this binding by reference, so reassigning
  // it (`ops = []`) when starting a new page transparently redirects
  // every subsequent draw call onto the new page.
  let ops = [];
  const pages = [];
  let pageNumber = 1;

  const startNewPage = () => {
    pages.push(ops);
    ops = [];
    pageNumber += 1;
  };

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
  // Draws an image XObject into the given box — `name` is the resource key
  // (see the /XObject dict in the object graph below).
  const drawImage = (name, x, y, width, height) => {
    ops.push('q');
    ops.push(`${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm`);
    ops.push(`/${name} Do`);
    ops.push('Q');
  };
  // Right-aligned text: measures the string and places it flush with
  // `right`, so the header can grow a second phone number without any
  // coordinate tweaking or risk of running off the page.
  const drawTextRight = (font, size, right, y, text, r, g, b) => {
    drawText(font, size, right - measurePdfText(font, size, text), y, text, r, g, b);
  };
  // The EiiE Dairyfarm logo, sized by height, with its left edge at `x`.
  const drawLogo = (x, y, height) => {
    const logo = getArtwork('logo');
    if (!logo || !logo.width || !logo.height) {
      return;
    }
    drawImage('LogoImg', x, y, height * (logo.width / logo.height), height);
  };
  // The dairy seal, sitting on top of the sign-off line. The legacy asset key
  // remains `signature` so existing native and browser bundle data stays stable.
  const drawSeal = (bottomY, height, right = 550) => {
    const seal = getArtwork('signature');
    if (!seal || !seal.width || !seal.height) {
      return;
    }
    const width = height * (seal.width / seal.height);
    drawImage('SealImg', right - width, bottomY, width, height);
  };

  // Full brand header + title/meta + party details — page 1 only.
  const drawFullHeader = () => {
    // Green header accent line
    setStrokeColor(0.122, 0.427, 0.243); // #1F6D3E
    setLineWidth(2);
    drawLine(36, 750, 559, 750);

    // Real logo (falls back to the initials badge if the asset is missing)
    if (getArtwork('logo')) {
      drawLogo(36, 756, LOGO_HEIGHT);
    } else {
      setFillColor(0.906, 0.961, 0.925); // #E7F5EC
      setStrokeColor(0.122, 0.427, 0.243);
      drawRect(36, 756, 42, 42, true, true);
      drawText('F2', 12, 44, 772, 'EiiE', 0.122, 0.427, 0.243);
    }

    // Brand text
    drawText('F2', 20, 86, 782, BRAND.name, 0.075, 0.306, 0.180); // #134e2e
    drawText('F3', 8.5, 86, 768, BRAND.tagline, 0.122, 0.427, 0.243);

    // Contact Info (Right aligned)
    drawTextRight('F1', 8, CONTENT_RIGHT, 792, BRAND_CONTACT_LINES[0], 0.278, 0.333, 0.412);
    drawTextRight('F1', 8, CONTENT_RIGHT, 778, BRAND_CONTACT_LINES[1], 0.278, 0.333, 0.412);
    drawTextRight('F1', 8, CONTENT_RIGHT, 764, BRAND_CONTACT_LINES[2], 0.278, 0.333, 0.412);

    // Title & Bill Metadata
    drawText('F2', 24, 36, 712, billTitle, 0.118, 0.227, 0.541); // #1e3a8a
    drawText('F1', 11, 36, 696, billSubtitle, 0.278, 0.333, 0.412);

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

    // Party Details Box (Seller or Customer, depending on bill type)
    setFillColor(0.937, 0.965, 1.0); // #eff6ff
    drawRect(36, 652, 523, 18, true, false);
    drawText('F2', 9.5, 42, 657, partyLabel, 0.118, 0.227, 0.541);

    drawText('F2', 9, 42, 636, 'Name', 0.278, 0.333, 0.412);
    drawText('F1', 9, 85, 636, `: ${party?.name || '—'}`, 0.059, 0.090, 0.165);

    drawText('F2', 9, 42, 622, 'Contact', 0.278, 0.333, 0.412);
    drawText('F1', 9, 85, 622, `: ${party?.contact || '—'}`, 0.059, 0.090, 0.165);

    drawText('F2', 9, 42, 608, 'Address', 0.278, 0.333, 0.412);
    drawText('F1', 9, 85, 608, `: ${party?.address || '—'}`, 0.059, 0.090, 0.165);
  };

  // Slim repeated header for continuation pages (2, 3, ...).
  const drawContinuationHeader = () => {
    drawLogo(36, 810, CONTINUATION_LOGO_HEIGHT);
    drawText('F2', 14, 62, 812, BRAND.name, 0.075, 0.306, 0.180);
    drawText(
      'F1',
      9,
      62,
      798,
      `${billTitle} · Bill No: ${billNumber} · Page ${pageNumber}`,
      0.278,
      0.333,
      0.412,
    );
    setStrokeColor(0.122, 0.427, 0.243);
    setLineWidth(1);
    drawLine(36, 790, 559, 790);
  };

  const drawTableHeader = y => {
    setFillColor(0.145, 0.388, 0.922); // #2563eb
    drawRect(36, y, 523, 20, true, false);

    drawText('F2', 8.5, 42, y + 6, 'No.', 1, 1, 1);
    drawText('F2', 8.5, 80, y + 6, 'Date', 1, 1, 1);
    drawText('F2', 8.5, 150, y + 6, 'Animal Type', 1, 1, 1);
    drawText('F2', 8.5, 235, y + 6, 'Shift', 1, 1, 1);
    drawText('F2', 8.5, 305, y + 6, 'Qty (Litres)', 1, 1, 1);
    drawText('F2', 8.5, 395, y + 6, 'Rate (Rs/L)', 1, 1, 1);
    drawText('F2', 8.5, 485, y + 6, 'Amount (Rs)', 1, 1, 1);
  };

  // ---- Page 1: full header + table header ----
  drawFullHeader();
  let currentY = FIRST_PAGE_TABLE_START_Y;
  drawTableHeader(currentY);
  currentY -= 18;

  // ---- Transaction rows, flowing onto new pages as needed ----
  transactions.forEach((p, idx) => {
    if (currentY - ROW_HEIGHT < BOTTOM_MARGIN) {
      startNewPage();
      drawContinuationHeader();
      currentY = CONTINUATION_TABLE_START_Y;
      drawTableHeader(currentY);
      currentY -= 18;
    }

    if (idx % 2 === 1) {
      setFillColor(0.973, 0.980, 0.988);
      drawRect(36, currentY, 523, 18, true, false);
    }
    setStrokeColor(0.886, 0.910, 0.941); // #e2e8f0
    drawLine(36, currentY, 559, currentY);

    const d = formatDateString(p[dateField]) || '—';
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

    currentY -= ROW_HEIGHT;
  });

  // ---- Totals / amount-due / footer block — push to a fresh page if
  // there isn't enough room left on the current one ----
  if (currentY - FOOTER_BLOCK_HEIGHT < BOTTOM_MARGIN) {
    startNewPage();
    drawContinuationHeader();
    currentY = CONTINUATION_TABLE_START_Y;
  }

  // Table Total Row
  setFillColor(0.937, 0.965, 1.0); // #eff6ff
  setStrokeColor(0.749, 0.859, 0.996);
  drawRect(36, currentY, 523, 20, true, true);

  drawText('F2', 9, 230, currentY + 6, 'Total Amount', 0.118, 0.227, 0.541);
  drawText('F2', 9, 318, currentY + 6, `${Number(totalQuantity).toFixed(2)} L`, 0.118, 0.227, 0.541);
  drawText('F2', 10, 485, currentY + 6, `Rs ${Number(totalAmount).toFixed(2)}`, 0.118, 0.227, 0.541);

  currentY -= 30;

  // Summary & Payment Details Grid
  // Left: Amount to be paid / receivable card
  setFillColor(0.941, 0.976, 1.0); // #f0f9ff
  setStrokeColor(0.729, 0.902, 0.992); // #bae6fd
  drawRect(36, currentY - 55, 240, 68, true, true);

  drawText('F2', 9.5, 46, currentY + 2, amountCardLabel, 0.012, 0.412, 0.631);
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
  drawText('F1', 8, 365, currentY - 46, `: ${remarksLabel} (${formattedStartDate} - ${formattedEndDate})`, 0.059, 0.090, 0.165);

  currentY -= 110;

  // Footer & seal
  setStrokeColor(0.796, 0.835, 0.882);
  drawLine(36, currentY, 559, currentY);

  drawText('F3', 10, 36, currentY - 18, 'Thank you for your continued support!', 0.075, 0.306, 0.180);
  drawText('F1', 8, 36, currentY - 30, 'Your contribution helps us deliver fresh and quality dairy products.', 0.278, 0.333, 0.412);

  // Sign-off line, with the dairy seal resting on it
  setStrokeColor(0.200, 0.255, 0.333);
  drawLine(430, currentY - 28, 550, currentY - 28);
  drawSeal(currentY - 28, SEAL_HEIGHT);
  drawText('F2', 8, 504, currentY - 38, 'Dairy Seal', 0.059, 0.090, 0.165);
  drawText('F1', 7.5, 452, currentY - 48, BRAND.name, 0.392, 0.455, 0.545);

  // Decorative green bottom stripe
  setFillColor(0.122, 0.427, 0.243);
  drawRect(36, currentY - 60, 523, 6, true, false);

  // Finalize the last (in-progress) page.
  pages.push(ops);

  // ---- Construct the multi-page PDF object graph ----
  // ids 1 & 2 are reserved for the Catalog and Pages tree; each page
  // then gets a Page object + its own Contents stream object, the three
  // shared fonts come next and the brand images last.
  const numPages = pages.length;
  let nextId = 3;
  const pageIds = [];
  const contentIds = [];
  for (let i = 0; i < numPages; i += 1) {
    pageIds.push(nextId++);
    contentIds.push(nextId++);
  }
  const fontF1Id = nextId++;
  const fontF2Id = nextId++;
  const fontF3Id = nextId++;

  // Brand artwork. Declared as resources on every page (harmless — a reader
  // only draws what the content stream references) so the header logo,
  // continuation header logo and footer seal can all use them without
  // having to know which page they landed on.
  const logoImage = getArtwork('logo');
  const sealImage = getArtwork('signature');
  const logoImageId = logoImage ? nextId++ : 0;
  const sealImageId = sealImage ? nextId++ : 0;
  const xObjectResources = [
    logoImageId ? `/LogoImg ${logoImageId} 0 R` : null,
    sealImageId ? `/SealImg ${sealImageId} 0 R` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const totalObjects = nextId - 1;

  const objects = {};
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${numPages} >>`;

  pages.forEach((pageOps, i) => {
    const pageId = pageIds[i];
    const contentId = contentIds[i];
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R ` +
      `/F3 ${fontF3Id} 0 R >>${xObjectResources ? ` /XObject << ${xObjectResources} >>` : ''} >> >>`;

    const streamContent = pageOps.join('\n');
    objects[contentId] = `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`;
  });

  objects[fontF1Id] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[fontF2Id] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;
  objects[fontF3Id] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>`;

  if (logoImageId) {
    objects[logoImageId] = `${imageXObjectDict(logoImage)}\nstream\n${logoImage.decoded}\nendstream`;
  }
  if (sealImageId) {
    objects[sealImageId] =
      `${imageXObjectDict(sealImage)}\nstream\n${sealImage.decoded}\nendstream`;
  }

  let pdfString = '%PDF-1.4\n';
  const offsets = {};

  for (let id = 1; id <= totalObjects; id += 1) {
    offsets[id] = pdfString.length;
    pdfString += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = pdfString.length;
  pdfString += `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= totalObjects; id += 1) {
    pdfString += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }

  pdfString += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

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
