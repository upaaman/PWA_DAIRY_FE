/* eslint-env node */
import { amountToWords } from '../src/utils/numberToWords';
import { generateBillHtml } from '../src/utils/billTemplate';
import { sortBillTransactions } from '../src/utils/billTransactions';
import { base64ToBinaryString } from '../src/utils/pdfImage';
import { measurePdfText } from '../src/utils/pdfText';
import BILL_BRAND_IMAGES from '../src/assets/billBrandImages';

describe('numberToWords', () => {
  it('converts integers to Indian words correctly', () => {
    expect(amountToWords(0)).toBe('Rupees Zero Only');
    expect(amountToWords(746)).toBe('Rupees Seven Hundred Forty Six Only');
    expect(amountToWords(15000)).toBe('Rupees Fifteen Thousand Only');
  });

  it('converts decimals (paise) correctly', () => {
    expect(amountToWords(276.2)).toBe(
      'Rupees Two Hundred Seventy Six and Twenty Paise Only',
    );
    expect(amountToWords(576.5)).toBe(
      'Rupees Five Hundred Seventy Six and Fifty Paise Only',
    );
  });
});

describe('generateBillHtml', () => {
  it('generates HTML with seller info, bill number, dates, and transactions', () => {
    const mockData = {
      billNumber: 'Upadhyay_2026-09-16_2026-09-16',
      billDate: '2026-09-16',
      startDate: '2026-09-16',
      endDate: '2026-09-16',
      seller: {
        id: 2,
        name: 'Upadhyay',
        contact: '9399268695',
        address: 'MPEB Colony Khurshipar',
      },
      purchases: [
        {
          id: 10,
          purchaseDate: '2026-09-16',
          quantity: 12.0,
          rate: 48.0,
          animalType: 'BUFFALO',
          shift: 'EVENING',
          amount: 576.0,
        },
        {
          id: 11,
          purchaseDate: '2026-09-16',
          quantity: 5.0,
          rate: 34.0,
          animalType: 'COW',
          shift: 'MORNING',
          amount: 170.0,
        },
      ],
      totalQuantity: 17.0,
      totalAmount: 746.0,
    };

    const html = generateBillHtml(mockData);

    expect(html).toContain('EiiE Dairyfarm');
    expect(html).toContain('Upadhyay_2026-09-16_2026-09-16');
    expect(html).toContain('Upadhyay');
    expect(html).toContain('9399268695');
    expect(html).toContain('MPEB Colony Khurshipar');
    expect(html).toContain('BUFFALO');
    expect(html).toContain('576.00');
    expect(html).toContain('COW');
    expect(html).toContain('170.00');
    expect(html).toContain('746.00');
    expect(html).toContain('Rupees Seven Hundred Forty Six Only');
  });
});

describe('sortBillTransactions', () => {
  it('orders entries oldest → newest and leaves same-day order alone', () => {
    const rows = [
      { id: 1, purchaseDate: '2026-09-30' },
      { id: 2, purchaseDate: '2026-09-01' },
      { id: 3, purchaseDate: '2026-09-15' },
      { id: 4, purchaseDate: '2026-09-15' },
      { id: 5 },
    ];

    const sorted = sortBillTransactions(rows, 'purchaseDate');

    expect(sorted.map(row => row.id)).toEqual([5, 2, 3, 4, 1]);
  });

  it('does not mutate the input array', () => {
    const rows = [
      { id: 1, saleDate: '2026-09-30' },
      { id: 2, saleDate: '2026-09-01' },
    ];

    sortBillTransactions(rows, 'saleDate');

    expect(rows.map(row => row.id)).toEqual([1, 2]);
  });
});

describe('base64ToBinaryString', () => {
  it('round-trips the bill brand image payloads byte for byte', () => {
    Object.values(BILL_BRAND_IMAGES).forEach(image => {
      const bytes = base64ToBinaryString(image.data);
      const expected = Buffer.from(image.data, 'base64');

      expect(bytes.length).toBe(expected.length);
      for (let i = 0; i < expected.length; i += 4000) {
        expect(bytes.charCodeAt(i)).toBe(expected[i]);
      }
    });
  });
});

describe('measurePdfText', () => {
  it('returns zero for empty text and scales with the font size', () => {
    expect(measurePdfText('F1', 10, '')).toBe(0);
    expect(measurePdfText('F1', 10, 'iiii')).toBeCloseTo(
      measurePdfText('F1', 20, 'iiii') / 2,
      5,
    );
  });

  it('measures Helvetica digit/space widths', () => {
    // '0' = 556/1000 em, space = 278/1000 em
    expect(measurePdfText('F1', 10, '0 0')).toBeCloseTo(
      (556 * 2 + 278) * 0.01,
      5,
    );
  });
});

describe('purePdfBuilder', () => {
  const mockData = {
    billNumber: 'Upadhyay_2026-09-16_2026-09-16',
    billDate: '2026-09-16',
    startDate: '2026-09-16',
    endDate: '2026-09-16',
    seller: {
      id: 2,
      name: 'Upadhyay',
      contact: '9399268695',
      address: 'MPEB Colony Khurshipar',
    },
    purchases: [
      {
        id: 10,
        purchaseDate: '2026-09-16',
        quantity: 12.0,
        rate: 48.0,
        animalType: 'BUFFALO',
        shift: 'EVENING',
        amount: 576.0,
      },
    ],
    totalQuantity: 12.0,
    totalAmount: 576.0,
  };

  const toPdfText = base64 => Buffer.from(base64, 'base64').toString('latin1');

  it('generates base64 PDF string starting with valid PDF structure', () => {
    const {
      generatePdfBase64,
      generatePdfDataUri,
    } = require('../src/utils/purePdfBuilder');

    const base64 = generatePdfBase64(mockData);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(100);

    const dataUri = generatePdfDataUri(mockData);
    expect(dataUri.startsWith('data:application/pdf;base64,')).toBe(true);
  });

  it('brands the document with EiiE Dairyfarm and both phone numbers', () => {
    const { generatePdfBase64 } = require('../src/utils/purePdfBuilder');
    const pdf = toPdfText(generatePdfBase64(mockData));

    expect(pdf).toContain('EiiE Dairyfarm');
    expect(pdf).toContain('+91 9752248080 | +91 7909839867');
    expect(pdf).toContain('info@eiiedairyfarm.com');
    expect(pdf).not.toContain('Akku Dada');
    expect(pdf).not.toContain('akkudadadairy');
  });

  it('lists transactions oldest → newest regardless of input order', () => {
    const { generatePdfBase64 } = require('../src/utils/purePdfBuilder');

    const rows = [
      { id: 1, purchaseDate: '2026-09-30', amount: 10, quantity: 1, rate: 10 },
      { id: 2, purchaseDate: '2026-09-01', amount: 20, quantity: 1, rate: 20 },
      { id: 3, purchaseDate: '2026-09-15', amount: 30, quantity: 1, rate: 30 },
    ];
    const pdf = toPdfText(
      generatePdfBase64({ ...mockData, purchases: rows, totalAmount: 60 }),
    );

    const first = pdf.indexOf('01 Sept 2026');
    const second = pdf.indexOf('15 Sept 2026');
    const third = pdf.indexOf('30 Sept 2026');

    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);
  });

  it('embeds the logo and signature as image XObjects with exact stream lengths', () => {
    const { generatePdfBase64 } = require('../src/utils/purePdfBuilder');
    const pdf = toPdfText(generatePdfBase64(mockData));

    const images = pdf.match(
      /\/Type \/XObject[\s\S]*?\/Length (\d+) >>\nstream\n/g,
    );
    expect(images).toHaveLength(2);

    images.forEach(header => {
      expect(header).toContain('/ColorSpace /DeviceRGB');
      expect(header).toContain('/Filter /FlateDecode');
      expect(header).toContain('/Predictor 15');

      // The declared /Length must match the bytes actually written,
      // otherwise readers truncate or swallow the next object.
      const declared = Number(header.match(/\/Length (\d+)/)[1]);
      const start = pdf.indexOf(header) + header.length;
      const end = pdf.indexOf('\nendstream', start);
      expect(end - start).toBe(declared);
    });
  });

  it('writes a consistent xref table', () => {
    const { generatePdfBase64 } = require('../src/utils/purePdfBuilder');
    const pdf = toPdfText(generatePdfBase64(mockData));

    const xrefStart = pdf.indexOf('xref\n');
    const rows = pdf.slice(xrefStart).split('\n');
    const count = Number(rows[1].split(' ')[1]) - 1;

    for (let id = 1; id <= count; id += 1) {
      const offset = Number(rows[2 + id].slice(0, 10));
      expect(pdf.slice(offset, offset + `${id} 0 obj`.length)).toBe(
        `${id} 0 obj`,
      );
    }
  });
});
