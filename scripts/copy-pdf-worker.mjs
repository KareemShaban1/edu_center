/**
 * Copies pdf.js worker into public/ so production serves it with a stable URL
 * (nginx often lacks a MIME type for .mjs; .js is served as application/javascript).
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destDir = path.join(root, 'public');
const dest = path.join(destDir, 'pdf.worker.min.js');

await mkdir(destDir, { recursive: true });
await copyFile(source, dest);
console.log('Copied pdf.worker.min.js to public/');
