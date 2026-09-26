/**
 * brand.js
 *
 * Single source of truth for the dairy's identity, shared by every surface
 * the bill can appear on:
 *
 *   - src/utils/purePdfBuilder.js  (the generated PDF)
 *   - src/utils/billTemplate.js    (HTML bill template)
 *   - src/utils/pdfService.js      (plain-text receipt)
 *   - src/components/BillPreviewModal.js (in-app preview)
 *
 * Change a value here and it updates everywhere — no need to hunt for
 * hard-coded copies.
 */

export const BRAND = {
  name: 'EiiE Dairyfarm',
  tagline: 'Healthy Animals | Fresh Milk | Better Tomorrow',
  address: 'Bagicha Farm , Gram Khurshipar 487551',
  phones: ['+91 9752248080', '+91 7909839867'],
  email: 'info@eiiedairyfarm.com',
};

// "9752248080 | 7909839867" — kept separate from `phones` so the printed
// form can be tweaked without touching the individual numbers.
export const BRAND_PHONE_LINE = BRAND.phones.join(' | ');

// The three lines of the address block, top to bottom.
export const BRAND_CONTACT_LINES = [
  BRAND.address,
  BRAND_PHONE_LINE,
  BRAND.email,
];

export default BRAND;
