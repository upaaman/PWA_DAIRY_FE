/* eslint-env node */
import { generatePdfBase64 } from '../src/utils/purePdfBuilder';

describe('purePdfBuilder pagination sanity check', () => {
  it('produces a structurally valid multi-page PDF for many rows', () => {
    const dates = [
      '2026-09-17', '2026-09-16', '2026-09-15', '2026-09-13',
      '2026-09-12', '2026-09-12', '2026-09-10', '2026-09-10',
    ];
    const transactions = [];
    for (let i = 0; i < 32; i++) {
      transactions.push({
        id: i + 1,
        saleDate: dates[i % dates.length],
        animalType: i % 5 === 0 ? 'BUFFALO' : 'COW',
        shift: i % 2 === 0 ? 'EVENING' : 'MORNING',
        quantity: 2.1,
        rate: 43,
        amount: 90.3,
      });
    }

    const billData = {
      billNumber: 'cus1_2026-09-01_2026-09-17',
      billDate: new Date('2026-09-17'),
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-17'),
      partyRole: 'customer',
      customer: { name: 'cus1', contact: '23123234', address: 'Kamti' },
      sales: transactions,
      dateField: 'saleDate',
      totalQuantity: transactions.reduce((s, t) => s + t.quantity, 0),
      totalAmount: transactions.reduce((s, t) => s + t.amount, 0),
    };

    const base64 = generatePdfBase64(billData);
    const pdfBuffer = Buffer.from(base64, 'base64');
    const pdfString = pdfBuffer.toString('latin1');

    expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfString.trim().endsWith('%%EOF')).toBe(true);

    const pageCount = (pdfString.match(/\/Type \/Page(?!s)/g) || []).length;
    // 32 rows @ 18pt each won't fit on one page's ~29-row capacity, so
    // expect at least 2 pages.
    expect(pageCount).toBeGreaterThanOrEqual(2);

    // Every stream's declared /Length must match its actual byte length.
    const streamRegex = /(\d+) 0 obj\n<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g;
    let match;
    let streamCount = 0;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      streamCount += 1;
      expect(match[3].length).toBe(parseInt(match[2], 10));
    }
    expect(streamCount).toBe(pageCount);

    // Every xref offset must point at the correct "<id> 0 obj" header.
    const xrefSectionMatch = pdfString.match(/xref\n0 (\d+)\n([\s\S]*?)\ntrailer/);
    expect(xrefSectionMatch).toBeTruthy();
    const entries = xrefSectionMatch[2].trim().split('\n');
    for (let i = 1; i < entries.length; i++) {
      const offset = parseInt(entries[i].trim().split(' ')[0], 10);
      const snippet = pdfString.substr(offset, `${i} 0 obj`.length);
      expect(snippet).toBe(`${i} 0 obj`);
    }

    // Sanity check: last page should contain the footer/signature text,
    // proving it wasn't cut off.
    expect(pdfString).toMatch(/Authorized Signature/);
    expect(pdfString).toMatch(/Total Amount/);
  });

  it('stays on a single page for a small number of rows', () => {
    const billData = {
      billNumber: 'seller1_2026-09-01_2026-09-05',
      billDate: new Date('2026-09-05'),
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-05'),
      partyRole: 'seller',
      seller: { name: 'seller1', contact: '123', address: 'Addr' },
      purchases: [
        { id: 1, purchaseDate: '2026-09-01', animalType: 'COW', shift: 'MORNING', quantity: 5, rate: 40, amount: 200 },
        { id: 2, purchaseDate: '2026-09-02', animalType: 'BUFFALO', shift: 'EVENING', quantity: 3, rate: 50, amount: 150 },
      ],
      dateField: 'purchaseDate',
      totalQuantity: 8,
      totalAmount: 350,
    };

    const base64 = generatePdfBase64(billData);
    const pdfString = Buffer.from(base64, 'base64').toString('latin1');
    const pageCount = (pdfString.match(/\/Type \/Page(?!s)/g) || []).length;
    expect(pageCount).toBe(1);
  });
});
