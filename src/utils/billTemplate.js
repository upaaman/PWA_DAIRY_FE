/**
 * billTemplate.js
 *
 * Generates high-fidelity HTML for the EiiE Dairyfarm Payment Bill,
 * matching the layout the app's PDF builder produces.
 */
import { formatDateString } from './date';
import { amountToWords } from './numberToWords';
import { BRAND, BRAND_CONTACT_LINES } from '../constants/brand';
import { sortBillTransactions } from './billTransactions';

export const generateBillHtml = ({
  billNumber,
  billDate = new Date(),
  startDate,
  endDate,
  seller,
  purchases = [],
  totalQuantity = 0,
  totalAmount = 0,
}) => {
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

  // Bills read as a ledger: oldest entry first, no matter how the calling
  // screen ordered the records.
  const rowsHtml = sortBillTransactions(purchases, 'purchaseDate')
    .map((item, index) => {
      const dateFormatted = item.purchaseDate
        ? formatDateString(item.purchaseDate)
        : '—';
      const animal = item.animalType || '—';
      const shift = item.shift || '—';
      const qty = Number(item.quantity || 0).toFixed(2);
      const rate = Number(item.rate || 0).toFixed(2);
      const amt = Number(item.amount || 0).toFixed(2);

      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td class="text-center">${dateFormatted}</td>
          <td class="text-center">${animal}</td>
          <td class="text-center">${shift}</td>
          <td class="text-center">${qty}</td>
          <td class="text-center">${rate}</td>
          <td class="text-right font-semibold">${amt}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Bill - ${billNumber}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #ffffff;
      color: #1e293b;
      padding: 28px 32px;
      font-size: 13px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 2px solid #1f6d3e;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 60px;
      height: 60px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #134e2e;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 11px;
      color: #1f6d3e;
      font-style: italic;
      font-weight: 500;
      margin-top: 2px;
    }
    .contact-info {
      text-align: right;
      font-size: 11.5px;
      color: #334155;
    }
    .contact-item {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      margin-bottom: 4px;
    }
    .contact-icon {
      font-size: 12px;
      color: #1f6d3e;
    }

    /* Bill Title & Meta */
    .bill-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 20px;
      margin-bottom: 16px;
    }
    .bill-main-title h1 {
      font-size: 30px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.5px;
    }
    .bill-main-title p {
      font-size: 14px;
      color: #475569;
      font-weight: 500;
      margin-top: 2px;
    }
    .meta-box {
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      overflow: hidden;
      width: 260px;
      background-color: #f8fafc;
    }
    .meta-row {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-label {
      width: 90px;
      background-color: #eff6ff;
      padding: 6px 10px;
      font-weight: 600;
      color: #1e3a8a;
      border-right: 1px solid #bfdbfe;
    }
    .meta-value {
      flex: 1;
      padding: 6px 10px;
      font-weight: 600;
      color: #0f172a;
      word-break: break-all;
    }

    /* Seller Details */
    .seller-section {
      margin-bottom: 20px;
    }
    .section-header {
      background-color: #eff6ff;
      color: #1e3a8a;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 4px;
      margin-bottom: 8px;
      border-left: 4px solid #2563eb;
    }
    .seller-grid {
      display: table;
      width: 100%;
      font-size: 12.5px;
      padding-left: 4px;
    }
    .seller-row {
      display: table-row;
      line-height: 1.8;
    }
    .seller-lbl {
      display: table-cell;
      width: 90px;
      font-weight: 600;
      color: #475569;
    }
    .seller-colon {
      display: table-cell;
      width: 18px;
      font-weight: 600;
      color: #64748b;
    }
    .seller-val {
      display: table-cell;
      font-weight: 600;
      color: #0f172a;
    }

    /* Table */
    .table-container {
      margin-top: 14px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background-color: #2563eb;
      color: #ffffff;
      padding: 9px 8px;
      font-weight: 700;
      border: 1px solid #1d4ed8;
      font-size: 12px;
      letter-spacing: 0.2px;
    }
    td {
      padding: 8px 8px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-semibold { font-weight: 600; }

    .total-row td {
      background-color: #eff6ff;
      font-weight: 800;
      font-size: 13px;
      color: #1e3a8a;
      border: 1px solid #bfdbfe;
      padding: 9px 8px;
    }

    /* Summary & Payment Grid */
    .summary-grid {
      display: flex;
      gap: 16px;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    .amount-box {
      flex: 1.1;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 14px 16px;
    }
    .amount-box-title {
      font-size: 13px;
      font-weight: 700;
      color: #0369a1;
      margin-bottom: 4px;
    }
    .amount-large {
      font-size: 26px;
      font-weight: 800;
      color: #0c4a6e;
      margin-bottom: 4px;
    }
    .amount-words {
      font-size: 11.5px;
      color: #0284c7;
      font-weight: 600;
      line-height: 1.3;
    }

    .payment-box {
      flex: 1.3;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      background-color: #f8fafc;
    }
    .payment-box-header {
      background-color: #e0f2fe;
      padding: 6px 12px;
      font-size: 12.5px;
      font-weight: 700;
      color: #0369a1;
      border-bottom: 1px solid #bae6fd;
    }
    .payment-box-body {
      padding: 8px 12px;
      font-size: 11.5px;
    }
    .payment-row {
      display: flex;
      margin-bottom: 5px;
    }
    .payment-row:last-child {
      margin-bottom: 0;
    }
    .pay-lbl {
      width: 100px;
      font-weight: 600;
      color: #64748b;
    }
    .pay-val {
      flex: 1;
      font-weight: 600;
      color: #0f172a;
    }

    /* Footer / Signoff */
    .footer-divider {
      border-top: 1px solid #cbd5e1;
      margin-top: 20px;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .thankyou-text {
      max-width: 320px;
    }
    .thankyou-title {
      font-size: 13.5px;
      font-weight: 700;
      font-style: italic;
      color: #134e2e;
      margin-bottom: 4px;
    }
    .thankyou-desc {
      font-size: 11px;
      color: #475569;
    }

    .signature-block {
      text-align: center;
      width: 180px;
    }
    .signature-img {
      height: 36px;
      margin-bottom: 2px;
    }
    .signature-line {
      border-top: 1px solid #334155;
      margin-top: 2px;
      padding-top: 4px;
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }
    .signature-org {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    /* Bottom art strip */
    .pasture-strip {
      margin-top: 24px;
      height: 12px;
      background: linear-gradient(to right, #1f6d3e, #4caf50, #164f2d);
      border-radius: 6px;
    }

    @media print {
      body {
        padding: 16px 20px;
      }
    }
  </style>
</head>
<body>
  <!-- Header Section -->
  <div class="header">
    <div class="brand-section">
      <svg class="brand-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#E7F5EC" stroke="#1F6D3E" stroke-width="3"/>
        <path d="M30 65 C30 50, 45 45, 55 45 C65 45, 75 52, 75 65 Z" fill="#1F6D3E"/>
        <circle cx="45" cy="40" r="10" fill="#1F6D3E"/>
        <path d="M52 35 Q58 30 64 36 Q60 42 52 38 Z" fill="#134E2E"/>
        <circle cx="43" cy="38" r="1.5" fill="#FFFFFF"/>
        <ellipse cx="60" cy="58" rx="7" ry="5" fill="#4CAF50"/>
      </svg>
      <div>
        <div class="brand-title">${BRAND.name}</div>
        <div class="brand-tagline">${BRAND.tagline}</div>
      </div>
    </div>

    <div class="contact-info">
      <div class="contact-item">
        <span class="contact-icon">📍</span>
        <span>${BRAND_CONTACT_LINES[0]}</span>
      </div>
      <div class="contact-item">
        <span class="contact-icon">📞</span>
        <span>${BRAND_CONTACT_LINES[1]}</span>
      </div>
      <div class="contact-item">
        <span class="contact-icon">✉️</span>
        <span>${BRAND_CONTACT_LINES[2]}</span>
      </div>
    </div>
  </div>

  <!-- Bill Title & Meta -->
  <div class="bill-meta-row">
    <div class="bill-main-title">
      <h1>Payment Bill</h1>
      <p>(To be paid to Seller)</p>
    </div>
    <div class="meta-box">
      <div class="meta-row">
        <div class="meta-label">Bill No.</div>
        <div class="meta-value">${billNumber}</div>
      </div>
      <div class="meta-row">
        <div class="meta-label">Bill Date</div>
        <div class="meta-value">${formattedBillDate}</div>
      </div>
      <div class="meta-row">
        <div class="meta-label">Period</div>
        <div class="meta-value">${formattedStartDate} - ${formattedEndDate}</div>
      </div>
    </div>
  </div>

  <!-- Seller Details -->
  <div class="seller-section">
    <div class="section-header">Seller Details</div>
    <div class="seller-grid">
      <div class="seller-row">
        <div class="seller-lbl">Name</div>
        <div class="seller-colon">:</div>
        <div class="seller-val">${seller?.name || '—'}</div>
      </div>
      <div class="seller-row">
        <div class="seller-lbl">Contact</div>
        <div class="seller-colon">:</div>
        <div class="seller-val">${seller?.contact || '—'}</div>
      </div>
      <div class="seller-row">
        <div class="seller-lbl">Address</div>
        <div class="seller-colon">:</div>
        <div class="seller-val">${seller?.address || '—'}</div>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>Date</th>
          <th>Animal Type</th>
          <th>Shift</th>
          <th>Quantity<br/>(Litres)</th>
          <th>Rate<br/>(₹/L)</th>
          <th>Amount<br/>(₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" class="text-center">No purchase records found for this period.</td></tr>'}
        <tr class="total-row">
          <td colspan="4" class="text-right">Total:</td>
          <td class="text-center">${Number(totalQuantity || 0).toFixed(2)} L</td>
          <td class="text-center">—</td>
          <td class="text-right">₹ ${Number(totalAmount || 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Amount and Payment Summary -->
  <div class="summary-grid">
    <div class="amount-box">
      <div class="amount-box-title">Amount to be Paid</div>
      <div class="amount-large">₹ ${Number(totalAmount || 0).toFixed(2)}</div>
      <div class="amount-words">(${words})</div>
    </div>

    <div class="payment-box">
      <div class="payment-box-header">Payment Details</div>
      <div class="payment-box-body">
        <div class="payment-row">
          <div class="pay-lbl">Payment Mode</div>
          <div class="pay-val">: Cash / Bank Transfer</div>
        </div>
        <div class="payment-row">
          <div class="pay-lbl">Due Date</div>
          <div class="pay-val">: ${formattedBillDate}</div>
        </div>
        <div class="payment-row">
          <div class="pay-lbl">Remarks</div>
          <div class="pay-val">: Milk Purchase (${formattedStartDate} to ${formattedEndDate})</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-divider">
    <div class="thankyou-text">
      <div class="thankyou-title">Thank you for your continued support!</div>
      <div class="thankyou-desc">Your contribution helps us deliver fresh and quality dairy products.</div>
    </div>

    <div class="signature-block">
      <svg class="signature-img" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 25 C 25 10, 35 35, 50 15 C 65 5, 75 30, 95 18 C 105 12, 110 22, 115 20" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" fill="none"/>
      </svg>
      <div class="signature-line">Authorized Signature</div>
      <div class="signature-org">${BRAND.name}</div>
    </div>
  </div>

  <div class="pasture-strip"></div>
</body>
</html>`;
};

export default generateBillHtml;
