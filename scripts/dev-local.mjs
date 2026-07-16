import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const children = [];

function start(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(isWin ? undefined : 'SIGTERM');
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('Starting EduCenter locally…');
console.log('  API:  http://127.0.0.1:8000');
console.log('  App:  http://127.0.0.1:8080');
console.log('');

start('api', 'php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], path.join(root, 'backend'));
start('web', 'npm', ['run', 'dev'], root);
