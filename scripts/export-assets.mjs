import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFilePath);
const projectRoot = path.resolve(scriptsDirectory, '..');
const marketplaceDirectory = path.join(projectRoot, 'assets', 'marketplace');
const outputDirectory = marketplaceDirectory;

await mkdir(outputDirectory, { recursive: true });

await exportAsset('app-icon.svg', 'app-icon-512.png', 512, 512);
await exportAsset('app-icon.svg', 'app-icon-256.png', 256, 256);
await exportAsset('app-icon-alt.svg', 'app-icon-alt-512.png', 512, 512);
await exportAsset('app-icon-alt.svg', 'app-icon-alt-256.png', 256, 256);
await exportAsset('listing-banner.svg', 'listing-banner-1600x900.png', 1600, 900);
await exportAsset('listing-banner.svg', 'listing-banner-1200x675.png', 1200, 675);
await exportAsset('listing-banner-alt.svg', 'listing-banner-alt-1600x900.png', 1600, 900);
await exportAsset('listing-banner-alt.svg', 'listing-banner-alt-1200x675.png', 1200, 675);

console.log(`Exported publish assets to ${path.relative(projectRoot, outputDirectory)}`);

async function exportAsset(inputFileName, outputFileName, width, height) {
  const inputPath = path.join(marketplaceDirectory, inputFileName);
  const outputPath = path.join(outputDirectory, outputFileName);

  await sharp(inputPath)
    .resize(width, height, { fit: 'cover' })
    .png()
    .toFile(outputPath);
}