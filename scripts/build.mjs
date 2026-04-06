import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFilePath);
const projectRoot = path.resolve(scriptsDirectory, '..');
const publicDirectory = path.join(projectRoot, 'public');
const distDirectory = path.join(projectRoot, 'dist');

await rm(distDirectory, { recursive: true, force: true });
await mkdir(distDirectory, { recursive: true });
await cp(publicDirectory, distDirectory, { recursive: true });
await copyOptionalFile('_headers');

const manifest = {
  name: 'live-visitor-geo-pulse-ecwid',
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  output: 'dist',
  files: ['index.html', 'app.css', 'app.js', 'dashboard-metrics.js', '_headers'],
};

await writeFile(
  path.join(distDirectory, 'build-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
  'utf8'
);

console.log(`Built static dashboard to ${path.relative(projectRoot, distDirectory)}`);

async function copyOptionalFile(relativePath) {
  try {
    await cp(path.join(projectRoot, relativePath), path.join(distDirectory, relativePath));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}