/**
 * See the README.md-file in `./src/logout/` for more information.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const apiUrl = process.env.NG_URL_121_SERVICE_API;
if (!apiUrl) {
  throw new Error(
    'NG_URL_121_SERVICE_API is required. Cannot create logout-script without it.',
  );
}

// Set up specifics
const sourcePath = join(import.meta.dirname, '../src/logout/');
const targetPath = join(import.meta.dirname, '../www/logout/');

// Create target
mkdirSync(targetPath, { recursive: true });

// Set current API-URL from "NG_URL_121_SERVICE_API"
const logoutJs = readFileSync(join(sourcePath, 'logout.js'), 'utf8');
const updatedLogoutJs = logoutJs.replace(
  /`NG_URL_121_SERVICE_API`/,
  JSON.stringify(apiUrl),
);
writeFileSync(join(targetPath, 'logout.js'), updatedLogoutJs);
console.info(`Logout API set at: ${JSON.stringify(apiUrl)}`);

// Copy HTML
copyFileSync(join(sourcePath, 'index.html'), join(targetPath, 'index.html'));

console.info(`Manual Logout generated at: ${targetPath}`);
