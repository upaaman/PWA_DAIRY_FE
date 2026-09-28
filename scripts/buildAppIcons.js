/* eslint-env node */
/**
 * scripts/buildAppIcons.js
 *
 * One-off (re)build step for the launcher icon — Node only, run manually:
 *
 *   npm run build:app-icons
 *   npm run build:app-icons -- /path/to/logo.png
 *
 * Takes the EiiE Dairyfarm badge (a transparent PNG), centres it on a
 * white square, and writes every size the two platforms ask for:
 *
 *   assets/app-icon.png                 1024x1024 generated master
 *   ios/FeDairy/Images.xcassets/
 *     AppIcon.appiconset/Icon-*.png     opaque — iOS rejects alpha
 *   android/app/src/main/res/mipmap-<density>/
 *     ic_launcher.png                   opaque square
 *     ic_launcher_round.png             circular, transparent surround
 *     ic_launcher_foreground.png        108dp adaptive layer
 *   android/app/src/main/res/mipmap-anydpi-v26/
 *     ic_launcher*.xml                  adaptive icon definitions
 *
 * The badge is only ~592px wide, so the master is a mild upscale of it;
 * sampling is bilinear in premultiplied space so the edges stay clean.
 * Nothing here runs on the device — the app just ships the PNGs.
 */
const fs = require('fs');
const path = require('path');

const { decodePng, encodePng, contentBox } = require('./buildBillBrandAssets');

const ROOT = path.join(__dirname, '..');
const IOS_APPICON_DIR = path.join(
  ROOT,
  'ios',
  'FeDairy',
  'Images.xcassets',
  'AppIcon.appiconset',
);
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const MASTER_FILE = path.join(ROOT, 'assets', 'app-icon.png');

const DEFAULT_SOURCE = path.join(ROOT, 'assets', 'app-logo-source.png');

// Larger artwork for legacy Android and iOS icons. Modern Android uses
// a separate 108dp adaptive canvas: its central 72dp is the visible mask.
const BADGE_RATIO = 0.86;
const ADAPTIVE_BADGE_RATIO = 0.60;
const MASTER_SIZE = 1024;
const BACKGROUND = [255, 255, 255];

// points x scale -> pixel edge length
const IOS_ICONS = [
  { size: '20x20', scale: '2x', file: 'Icon-20@2x.png' },
  { size: '20x20', scale: '3x', file: 'Icon-20@3x.png' },
  { size: '29x29', scale: '2x', file: 'Icon-29@2x.png' },
  { size: '29x29', scale: '3x', file: 'Icon-29@3x.png' },
  { size: '40x40', scale: '2x', file: 'Icon-40@2x.png' },
  { size: '40x40', scale: '3x', file: 'Icon-40@3x.png' },
  { size: '60x60', scale: '2x', file: 'Icon-60@2x.png' },
  { size: '60x60', scale: '3x', file: 'Icon-60@3x.png' },
  { size: '1024x1024', scale: '1x', file: 'Icon-1024.png' },
];

const ANDROID_DENSITIES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// Bilinear resample of a crop, in premultiplied space (weighting the
// colours rather than the alpha keeps transparent pixels from bleeding
// their colour into the badge's edge).
const resampleBilinear = (image, box, targetWidth, targetHeight) => {
  const { width, height, rgba } = image;
  const out = Buffer.alloc(targetWidth * targetHeight * 4);
  const stepX = box.width / targetWidth;
  const stepY = box.height / targetHeight;

  for (let ty = 0; ty < targetHeight; ty += 1) {
    const sourceY = (ty + 0.5) * stepY - 0.5;
    const y0 = Math.floor(sourceY);
    const fy = sourceY - y0;
    const yA = box.y + clamp(y0, 0, box.height - 1);
    const yB = box.y + clamp(y0 + 1, 0, box.height - 1);

    for (let tx = 0; tx < targetWidth; tx += 1) {
      const sourceX = (tx + 0.5) * stepX - 0.5;
      const x0 = Math.floor(sourceX);
      const fx = sourceX - x0;
      const xA = box.x + clamp(x0, 0, box.width - 1);
      const xB = box.x + clamp(x0 + 1, 0, box.width - 1);

      const corners = [
        [xA, yA, (1 - fx) * (1 - fy)],
        [xB, yA, fx * (1 - fy)],
        [xA, yB, (1 - fx) * fy],
        [xB, yB, fx * fy],
      ];

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      corners.forEach(([x, y, weight]) => {
        const i = clamp(y, 0, height - 1) * width + clamp(x, 0, width - 1);
        const alpha = rgba[i * 4 + 3] / 255;
        r += rgba[i * 4] * alpha * weight;
        g += rgba[i * 4 + 1] * alpha * weight;
        b += rgba[i * 4 + 2] * alpha * weight;
        a += rgba[i * 4 + 3] * weight;
      });

      const o = (ty * targetWidth + tx) * 4;
      if (a > 0) {
        out[o] = Math.round(r / (a / 255));
        out[o + 1] = Math.round(g / (a / 255));
        out[o + 2] = Math.round(b / (a / 255));
      }
      out[o + 3] = Math.round(a);
    }
  }

  return { width: targetWidth, height: targetHeight, rgba: out };
};

// White square, badge centred, optionally clipped to a circle. Returns
// the planes `encodePng` wants: always RGB, plus alpha for the round
// Android variant.
const composeIcon = (source, box, size, { round, badgeRatio = BADGE_RATIO }) => {
  const badgeWidth = Math.round(size * badgeRatio);
  const badgeHeight = Math.max(
    1,
    Math.round((badgeWidth * box.height) / box.width),
  );
  const badge = resampleBilinear(source, box, badgeWidth, badgeHeight);
  const offsetX = Math.round((size - badgeWidth) / 2);
  const offsetY = Math.round((size - badgeHeight) / 2);

  const rgb = Buffer.alloc(size * size * 3);
  const alpha = round ? Buffer.alloc(size * size) : null;
  const centre = (size - 1) / 2;
  const radius = size / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const o = y * size + x;
      let colour = BACKGROUND;

      const bx = x - offsetX;
      const by = y - offsetY;
      if (bx >= 0 && by >= 0 && bx < badgeWidth && by < badgeHeight) {
        const i = (by * badgeWidth + bx) * 4;
        const a = badge.rgba[i + 3] / 255;
        colour = [0, 1, 2].map(c =>
          Math.round(badge.rgba[i + c] * a + 255 * (1 - a)),
        );
      }

      rgb[o * 3] = colour[0];
      rgb[o * 3 + 1] = colour[1];
      rgb[o * 3 + 2] = colour[2];

      if (alpha) {
        // One pixel of antialiasing on the circle, so the round icon
        // does not show staircase edges at 192px.
        const dx = x - centre;
        const dy = y - centre;
        const distance = Math.sqrt(dx * dx + dy * dy);
        alpha[o] = Math.round(clamp(radius - distance + 0.5, 0, 1) * 255);
      }
    }
  }

  return { width: size, height: size, rgb, alpha: alpha || undefined };
};

const writeIcon = (file, icon) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(icon));
  return `${path.relative(ROOT, file)} (${icon.width}px, ${(
    fs.statSync(file).size / 1024
  ).toFixed(1)}KB)`;
};

const main = () => {
  const source = process.argv[2] || DEFAULT_SOURCE;
  if (!fs.existsSync(source)) {
    throw new Error(
      `logo not found: ${source}\n` +
        'pass a path to the transparent logo, e.g.\n' +
        '  npm run build:app-icons -- ~/Downloads/e2e_dairyfarm_logo_transparent.png',
    );
  }

  const decoded = decodePng(source);
  const box = contentBox(decoded, 'alpha');
  console.log(
    `badge ${box.width}x${box.height} of ` +
      `${decoded.width}x${decoded.height}px  (${source})`,
  );

  const written = [];

  // 1. Generated master. The original source is also stored in assets.
  written.push(
    writeIcon(MASTER_FILE, composeIcon(decoded, box, MASTER_SIZE, {})),
  );

  // 2. iOS — must be opaque, so no alpha plane here.
  IOS_ICONS.forEach(({ size, scale, file }) => {
    const points = Number(size.split('x')[0]);
    const pixels = points * Number(scale.replace('x', ''));
    written.push(
      writeIcon(
        path.join(IOS_APPICON_DIR, file),
        composeIcon(decoded, box, pixels, {}),
      ),
    );
  });

  // 3. Android.
  ANDROID_DENSITIES.forEach(({ dir, size }) => {
    written.push(
      writeIcon(
        path.join(ANDROID_RES, dir, 'ic_launcher.png'),
        composeIcon(decoded, box, size, {}),
      ),
    );
    written.push(
      writeIcon(
        path.join(ANDROID_RES, dir, 'ic_launcher_round.png'),
        composeIcon(decoded, box, size, { round: true }),
      ),
    );
  });

  // Adaptive icons avoid Android wrapping/shrinking a legacy icon again.
  ANDROID_DENSITIES.forEach(({ dir, size }) => {
    written.push(writeIcon(
      path.join(ANDROID_RES, dir, 'ic_launcher_foreground.png'),
      composeIcon(decoded, box, Math.round(size * 108 / 48), {
        badgeRatio: ADAPTIVE_BADGE_RATIO,
      }),
    ));
  });
  const adaptiveDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26');
  fs.mkdirSync(adaptiveDir, { recursive: true });
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@android:color/white" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
  ['ic_launcher.xml', 'ic_launcher_round.xml'].forEach(file => {
    fs.writeFileSync(path.join(adaptiveDir, file), adaptiveXml);
  });

  written.forEach(line => console.log(`  ${line}`));
  console.log(`\n${written.length} icons written`);
  console.log(
    `remember to add "filename" entries to\n` +
      `${path.relative(ROOT, IOS_APPICON_DIR)}/Contents.json if missing`,
  );
};

module.exports = { composeIcon, resampleBilinear };

if (require.main === module) {
  main();
}
