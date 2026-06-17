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
