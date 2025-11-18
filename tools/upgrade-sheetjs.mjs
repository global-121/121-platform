#!/usr/bin/env node

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  copyFileSync,
  writeFileSync,
} from 'node:fs';

// Determine paths
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendorDir = join(projectRoot, 'vendor');

if (!existsSync(vendorDir)) {
  mkdirSync(vendorDir);
}

const xlsxVersion = process.env.SHEETJS_VERSION;

if (!xlsxVersion) {
  console.warn('SHEETJS_VERSION environment variable is not set!');
  process.exit();
}

const xlsxFilename = `xlsx-${xlsxVersion}.tgz`;
const xlsxFilePath = join(vendorDir, xlsxFilename);
const xlsxDownloadUrl = `https://cdn.sheetjs.com/xlsx-${xlsxVersion}/xlsx-${xlsxVersion}.tgz`;

// Download the specific version of SheetJS package
console.log(`Downloading SheetJS version ${xlsxVersion}...`);

const response = await fetch(xlsxDownloadUrl);
if (!response.ok) {
  throw new Error(
    `Failed to fetch ${xlsxDownloadUrl}: ${response.status} ${response.statusText}`,
  );
}
const arrayBuffer = await response.arrayBuffer();
writeFileSync(xlsxFilePath, Buffer.from(arrayBuffer));

console.log(`Downloaded to ${xlsxFilePath}`);

// Copy the downloaded file to 121-service specific directory (for use in Docker builds)
const serviceVendorDir = join(projectRoot, 'services/121-service/vendor');
if (!existsSync(serviceVendorDir)) {
  mkdirSync(serviceVendorDir, { recursive: true });
}
const serviceXlsxFilePath = join(serviceVendorDir, xlsxFilename);
copyFileSync(xlsxFilePath, serviceXlsxFilePath);
console.log(`Copied to: ${serviceXlsxFilePath}`);

// Update package.json files to use the new package filename
const packageJsonPaths = [
  join(projectRoot, 'interfaces/portal/package.json'),
  join(projectRoot, 'e2e/package.json'),
  join(projectRoot, 'services/121-service/package.json'),
];

for (const packageJsonPath of packageJsonPaths) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  if (packageJson.dependencies && packageJson.dependencies.xlsx) {
    // Replace the filename-part only, to keep any specified path structure in each project intact
    packageJson.dependencies.xlsx = packageJson.dependencies.xlsx.replace(
      /vendor\/xlsx-([\d.]+)\.tgz/,
      `vendor/xlsx-${xlsxVersion}.tgz`,
    );
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`Updated "xlsx" dependency in: ${packageJsonPath}`);
}

console.log('SheetJS upgrade completed.');
console.log(
  'Make sure to commit the new version(s) and remove any old/unused version(s).',
);
