import { amountToWords } from '../src/utils/numberToWords';
import { generateBillHtml } from '../src/utils/billTemplate';

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

    expect(html).toContain('Akku Dada Dairy');
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

describe('purePdfBuilder', () => {
  it('generates base64 PDF string starting with valid PDF structure', () => {
    const { generatePdfBase64, generatePdfDataUri } = require('../src/utils/purePdfBuilder');
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

    const base64 = generatePdfBase64(mockData);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(100);

    const dataUri = generatePdfDataUri(mockData);
    expect(dataUri.startsWith('data:application/pdf;base64,')).toBe(true);
  });
});
