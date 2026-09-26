/**
 * pdfText.js
 *
 * Text measuring for the hand-rolled PDF writer in purePdfBuilder.js.
 *
 * The bill draws its own text with raw `Td` operators, so it also has to
 * know how wide a string will be if it wants to right-align anything or
 * guarantee a line cannot run past the page margin (the brand block gained
 * a second phone number, which is exactly the kind of change that silently
 * overflows when positions are hard-coded).
 *
 * Widths come from the Adobe base-14 Helvetica metrics, in 1/1000 em, for
 * the printable ASCII range. That is the same font the PDF declares, so the
 * measurement matches what a reader will actually render.
 */

// prettier-ignore
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 222, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

// prettier-ignore
const HELVETICA_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

// Font resource name (as used by purePdfBuilder) -> width table.
// Oblique shares the regular widths; only the glyph shapes differ.
const FONT_WIDTHS = {
  F1: HELVETICA,
  F2: HELVETICA_BOLD,
  F3: HELVETICA,
};

const FIRST_PRINTABLE = 32; // space
const LAST_PRINTABLE = 126; // ~

/**
 * Width of `text` in points when drawn with PDF font `font` at `size`.
 *
 * Non-ASCII characters are measured as a space because the writer replaces
 * them with one (see escapePdfText in purePdfBuilder) — keeping the
 * measurement in step with what is actually drawn.
 */
export const measurePdfText = (font, size, text) => {
  const widths = FONT_WIDTHS[font] || HELVETICA;
  const value = String(text || '');
  let total = 0;

  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const width =
      code < FIRST_PRINTABLE || code > LAST_PRINTABLE
        ? widths[0]
        : widths[code - FIRST_PRINTABLE];
    total += width;
  }

  return (total * size) / 1000;
};

export default measurePdfText;
