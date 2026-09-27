/* eslint-env node */
/**
 * scripts/buildBillBrandAssets.js
 *
 * One-off (re)build step for the E2E Dairyfarm brand images — Node only,
 * never bundled into the app.
 *
 * It takes the two source PNGs and produces:
 *
 *   1. assets/bill/e2e_dairyfarm_logo.png + assets/bill/signature.png
 *      Cropped, downscaled PNGs used by BillPreviewModal through plain
 *      `<Image source={require(...)} />`.
 *
 *   2. src/assets/billBrandImages.js  (generated)
 *      The same two images as base64 `RunLengthDecode` payloads. A PDF
 *      cannot read a PNG stream directly, and React Native cannot read an
 *      asset file as base64 at runtime without an extra native module —
 *      so the pixel data has to travel to the pure-JS PDF builder
 *      (src/utils/purePdfBuilder.js) as a string. RunLengthDecode is used
 *      instead of Flate because it needs no compressor at runtime and
 *      squeezes these flat-colour images very well.
 *
 * Everything is composited onto a white background: both surfaces that
 * consume the images (the PDF page and the bill card in the preview) are
 * white, so this is visually identical to keeping the alpha channel while
 * being a third of the payload.
 *
 * Usage:
 *   npm run build:bill-assets
 *   npm run build:bill-assets -- /path/to/logo.png /path/to/signature.png
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const DOWNLOADS = path.join(os.homedir(), 'Downloads');
const DEFAULT_SOURCES = {
  logo: path.join(DOWNLOADS, 'e2e_dairyfarm_logo_transparent.png'),
  signature: path.join(DOWNLOADS, 'signature_blue.png'),
};

// Rendered size in the PDF header (points) — only used to pick a sane
// source resolution (~250 DPI) and to report the result.
const TARGETS = {
  logo: { maxWidth: 144, maxHeight: 144 },
  signature: { maxWidth: 300, maxHeight: 300 },
};

/* ------------------------------------------------------------------ *
 * Minimal PNG decoder (8-bit, non-interlaced)                        *
 * ------------------------------------------------------------------ */
const decodePng = file => {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`${file} is not a PNG`);
  }

  let pos = 8;
  let header = null;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);

    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === 'PLTE') {
      palette = data;
    } else if (type === 'tRNS') {
      transparency = data;
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }

  if (!header) {
    throw new Error(`${file} has no IHDR chunk`);
  }
  if (header.bitDepth !== 8) {
    throw new Error(
      `${file}: only 8-bit PNGs are supported (got ${header.bitDepth})`,
    );
  }
  if (header.interlace !== 0) {
    throw new Error(`${file}: interlaced PNGs are not supported`);
  }

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.colorType];
  if (!channels) {
    throw new Error(`${file}: unsupported colour type ${header.colorType}`);
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = header;
  const bpp = channels; // 8-bit => 1 byte per channel
  const stride = width * bpp;
  const lines = Buffer.alloc(height * stride);

  let read = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[read];
    read += 1;
    const row = raw.subarray(read, read + stride);
    read += stride;

    const out = y * stride;
    const prev = out - stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? lines[out + x - bpp] : 0;
      const b = y > 0 ? lines[prev + x] : 0;
      const c = x >= bpp && y > 0 ? lines[prev + x - bpp] : 0;
      let value = row[x];

      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }

      lines[out + x] = value & 0xff;
    }
  }

  // Normalise everything to RGBA.
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    let r;
    let g;
    let b;
    let a = 255;

    if (header.colorType === 6) {
      r = lines[i * 4];
      g = lines[i * 4 + 1];
      b = lines[i * 4 + 2];
      a = lines[i * 4 + 3];
    } else if (header.colorType === 2) {
      r = lines[i * 3];
      g = lines[i * 3 + 1];
      b = lines[i * 3 + 2];
    } else if (header.colorType === 0) {
      r = g = b = lines[i];
    } else if (header.colorType === 4) {
      r = g = b = lines[i * 2];
      a = lines[i * 2 + 1];
    } else {
      const index = lines[i];
      r = palette[index * 3];
      g = palette[index * 3 + 1];
      b = palette[index * 3 + 2];
      a =
        transparency && index < transparency.length ? transparency[index] : 255;
    }

    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = a;
  }

  return { width, height, rgba };
};

/* ------------------------------------------------------------------ *
 * Minimal PNG encoder (8-bit RGB, no alpha)                           *
 * ------------------------------------------------------------------ */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

const crc32 = buf => {
  let crc = -1;
  for (let i = 0; i < buf.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
};

// Writes a non-interlaced 8-bit PNG. `rgb` holds 3 bytes per pixel, or
// `alpha` may be supplied alongside it (1 byte per pixel) to emit a
// truecolour-with-alpha image instead — the launcher icon's round variant
// needs that, the bill artwork does not.
const encodePng = ({ width, height, rgb, alpha }) => {
  // Interleave the alpha plane in first, so the filter pass below always
  // walks one already-correctly-strided buffer.
  let planes = rgb;
  if (alpha) {
    planes = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      planes[i * 4] = rgb[i * 3];
      planes[i * 4 + 1] = rgb[i * 3 + 1];
      planes[i * 4 + 2] = rgb[i * 3 + 2];
      planes[i * 4 + 3] = alpha[i];
    }
  }

  const channels = alpha ? 4 : 3;
  const stride = width * channels;
  // Filter type 1 (Sub) per row — cheap and effective on flat art.
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 1;
    for (let x = 0; x < stride; x += 1) {
      const value = planes[y * stride + x];
      const left = x >= channels ? planes[y * stride + x - channels] : 0;
      raw[rowStart + 1 + x] = (value - left) & 0xff;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = channels === 4 ? 6 : 2; // truecolour (+/- alpha)
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

/* ------------------------------------------------------------------ *
 * Image processing                                                   *
 * ------------------------------------------------------------------ */
// Bounding box of the "interesting" pixels: either anything with any
// alpha (logo) or anything that is not plain white (the signature is a
// scan on a white sheet).
const contentBox = ({ width, height, rgba }, mode) => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = rgba[i + 3];
      const solid = a > 8;
      const notWhite =
        255 - rgba[i] + (255 - rgba[i + 1]) + (255 - rgba[i + 2]) > 24;

      const interesting = mode === 'alpha' ? solid : solid && notWhite;
      if (!interesting) {
        continue;
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) {
    throw new Error('no visible pixels found');
  }

  const pad = mode === 'alpha' ? 2 : 6;
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    width: Math.min(width, maxX + pad) - Math.max(0, minX - pad) + 1,
    height: Math.min(height, maxY + pad) - Math.max(0, minY - pad) + 1,
  };
};

// Box-filter downscale in premultiplied space, so edges do not pick up
// dark fringes from the transparent pixels around the logo.
const resizeRgba = (image, box, targetWidth, targetHeight) => {
  const { width, height, rgba } = image;
  const sx = box.width / targetWidth;
  const sy = box.height / targetHeight;
  const out = Buffer.alloc(targetWidth * targetHeight * 4);

  for (let ty = 0; ty < targetHeight; ty += 1) {
    const y0 = box.y + Math.floor(ty * sy);
    const y1 = Math.max(y0 + 1, box.y + Math.floor((ty + 1) * sy));

    for (let tx = 0; tx < targetWidth; tx += 1) {
      const x0 = box.x + Math.floor(tx * sx);
      const x1 = Math.max(x0 + 1, box.x + Math.floor((tx + 1) * sx));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;

      for (let y = y0; y < y1 && y < height; y += 1) {
        for (let x = x0; x < x1 && x < width; x += 1) {
          const i = (y * width + x) * 4;
          const alpha = rgba[i + 3] / 255;
          r += rgba[i] * alpha;
          g += rgba[i + 1] * alpha;
          b += rgba[i + 2] * alpha;
          a += rgba[i + 3];
          n += 1;
        }
      }

      const o = (ty * targetWidth + tx) * 4;
      const alphaAvg = n > 0 ? a / n : 0;
      if (n > 0 && a > 0) {
        out[o] = Math.round(r / (a / 255));
        out[o + 1] = Math.round(g / (a / 255));
        out[o + 2] = Math.round(b / (a / 255));
      }
      out[o + 3] = Math.round(alphaAvg);
    }
  }

  return { width: targetWidth, height: targetHeight, rgba: out };
};

// Flatten onto white and keep only the RGB planes (alpha is dropped).
const flattenToWhite = ({ width, height, rgba }) => {
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i += 1) {
    const alpha = rgba[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c += 1) {
      const value = rgba[i * 4 + c];
      rgb[i * 3 + c] = Math.round(value * alpha + 255 * (1 - alpha));
    }
  }
  return { width, height, rgb };
};

/* ------------------------------------------------------------------ *
 * Flate payload (deflated here, inflated by the PDF viewer)           *
 * ------------------------------------------------------------------ */
const paethPredictor = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

// Applies PNG row filters (PDF 1.7 7.4.4.4) — the viewer reverses them
// after inflating, which is what makes these images compress so well.
// Picks the filter with the smallest sum of absolute differences per
// row, the heuristic from the PNG spec.
const applyRowFilters = ({ width, height, rgb }, bpp) => {
  const stride = width * bpp;
  const out = Buffer.alloc(height * (stride + 1));

  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    const prev = row - stride;
    const candidates = [];

    for (let filter = 0; filter <= 4; filter += 1) {
      const line = Buffer.alloc(stride);
      for (let x = 0; x < stride; x += 1) {
        const value = rgb[row + x];
        const left = x >= bpp ? rgb[row + x - bpp] : 0;
        const up = y > 0 ? rgb[prev + x] : 0;
        const upLeft = x >= bpp && y > 0 ? rgb[prev + x - bpp] : 0;

        if (filter === 0) line[x] = value;
        else if (filter === 1) line[x] = (value - left) & 0xff;
        else if (filter === 2) line[x] = (value - up) & 0xff;
        else if (filter === 3) line[x] = (value - ((left + up) >> 1)) & 0xff;
        else line[x] = (value - paethPredictor(left, up, upLeft)) & 0xff;
      }

      let score = 0;
      for (let x = 0; x < stride; x += 1) {
        const byte = line[x];
        score += byte < 128 ? byte : 256 - byte;
      }
      candidates.push({ filter, line, score });
    }

    const best = candidates.reduce((a, b) => (a.score <= b.score ? a : b));
    out[y * (stride + 1)] = best.filter;
    best.line.copy(out, y * (stride + 1) + 1);
  }

  return out;
};

/* ------------------------------------------------------------------ *
 * Main                                                               *
 * ------------------------------------------------------------------ */
const buildImage = (key, sourceFile, mode) => {
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`source image not found: ${sourceFile}`);
  }

  const decoded = decodePng(sourceFile);
  const box = contentBox(decoded, mode);
  const aspect = box.width / box.height;
  const target = TARGETS[key];

  let width = Math.min(target.maxWidth, box.width);
  let height = Math.round(width / aspect);
  if (height > target.maxHeight) {
    height = target.maxHeight;
    width = Math.round(height * aspect);
  }

  const scaled = resizeRgba(decoded, box, width, height);
  const flat = flattenToWhite(scaled);
  const rawBytes = width * height * 3;
  const deflated = zlib.deflateSync(applyRowFilters(flat, 3), { level: 9 });

  // Sanity check: what we ship must inflate back to exactly one filter
  // byte plus one RGB triplet per pixel.
  const restored = zlib.inflateSync(deflated);
  if (restored.length !== flat.height * (width * 3 + 1)) {
    throw new Error(`${key}: deflate round-trip mismatch`);
  }

  const png = encodePng(flat);

  return {
    key,
    width,
    height,
    aspect: width / height,
    box,
    sourceSize: { width: decoded.width, height: decoded.height },
    rawBytes,
    deflated,
    png,
  };
};

const main = () => {
  const [logoArg, signatureArg] = process.argv.slice(2);
  const sources = {
    logo: logoArg || DEFAULT_SOURCES.logo,
    signature: signatureArg || DEFAULT_SOURCES.signature,
  };

  const images = {
    logo: buildImage('logo', sources.logo, 'alpha'),
    signature: buildImage('signature', sources.signature, 'ink'),
  };

  // 1. App assets for the in-app bill preview.
  const assetDir = path.join(ROOT, 'assets', 'bill');
  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(
    path.join(assetDir, 'e2e_dairyfarm_logo.png'),
    images.logo.png,
  );
  fs.writeFileSync(path.join(assetDir, 'signature.png'), images.signature.png);

  // 2. Generated JS module with the PDF payloads.
  const modulePath = path.join(ROOT, 'src', 'assets', 'billBrandImages.js');
  fs.mkdirSync(path.dirname(modulePath), { recursive: true });

  const entry = (image, comment) =>
    [
      `  ${image.key}: {`,
      `    // ${comment}`,
      `    width: ${image.width},`,
      `    height: ${image.height},`,
      `    data: '${image.deflated.toString('base64')}',`,
      '  },',
    ].join('\n');

  const moduleSource = `/**
 * billBrandImages.js
 *
 * GENERATED FILE — do not edit by hand.
 * Rebuild with: npm run build:bill-assets
 *
 * The EiiE Dairyfarm logo and signature, pre-compressed for PDF embedding.
 * Each \`data\` string is base64 of a zlib stream holding the 8-bit
 * DeviceRGB samples of the image after PNG row filtering — exactly what
 * the image XObject in src/utils/purePdfBuilder.js declares as
 * \`/Filter /FlateDecode\` with \`/Predictor 15\`.
 *
 * Deflating here in Node, instead of on the device, is what keeps the PDF
 * builder pure: at runtime it only base64-decodes and writes bytes, with
 * no compressor and no native module.
 */
const BILL_BRAND_IMAGES = {
${entry(
  images.logo,
  `EiiE Dairyfarm logo, cropped to its badge (${images.logo.box.width}x${images.logo.box.height} of ${images.logo.sourceSize.width}x${images.logo.sourceSize.height})`,
)}
${entry(
  images.signature,
  `Authorised signature, cropped to the ink (${images.signature.box.width}x${images.signature.box.height} of ${images.signature.sourceSize.width}x${images.signature.sourceSize.height})`,
)}
};

export default BILL_BRAND_IMAGES;
`;

  fs.writeFileSync(modulePath, moduleSource);

  Object.values(images).forEach(image => {
    console.log(
      `${image.key.padEnd(9)} ${image.sourceSize.width}x${
        image.sourceSize.height
      } ` +
        `-> ${image.width}x${image.height}px  ` +
        `deflate ${(image.deflated.length / 1024).toFixed(1)}KB ` +
        `(raw ${(image.rawBytes / 1024).toFixed(1)}KB)  ` +
        `png ${(image.png.length / 1024).toFixed(1)}KB`,
    );
  });
  console.log(`\nwrote ${path.relative(ROOT, modulePath)}`);
  console.log(`wrote ${path.relative(ROOT, assetDir)}/*.png`);
};

// The PNG helpers are shared with scripts/buildAppIcons.js.
module.exports = {
  decodePng,
  encodePng,
  contentBox,
  resizeRgba,
  flattenToWhite,
};

if (require.main === module) {
  main();
}
