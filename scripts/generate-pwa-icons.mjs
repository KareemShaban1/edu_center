/**
 * Generates PWA / favicon PNGs from public/brand/app-icon.svg
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'public', 'brand', 'app-icon.svg');
const svg = await readFile(svgPath);

const outputs = [
  { file: 'public/pwa-192.png', size: 192 },
  { file: 'public/pwa-512.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/favicon-32.png', size: 32 },
];

for (const { file, size } of outputs) {
  const outPath = path.join(root, file);
  const png = await sharp(svg, { density: Math.max(72, Math.ceil((512 / size) * 72)) })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(outPath, png);
  console.log(`Wrote ${file} (${size}x${size})`);
}

/** Android notification tray badge: white silhouette on transparent (color icons show as white square). */
async function makeAndroidBadgePng(size = 96) {
  const { data, info } = await sharp(svg, { density: 144 })
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 24) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = alpha;
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

const badgePath = path.join(root, 'public', 'pwa-badge.png');
await writeFile(badgePath, await makeAndroidBadgePng(96));
console.log('Wrote public/pwa-badge.png (96x96, Android notification badge)');

