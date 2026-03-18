/**
 * See the README.md-file in `./src/logout/` for more information.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

// Set up specifics
const sourcePath = `../src/logout/`;
const targetPath = `../www/logout/`;

// Create target
if (!existsSync(targetPath)) {
  mkdirSync(targetPath, {
    recursive: true,
  });
}

// Set current API-URL from "NG_URL_121_SERVICE_API"
const logoutJs = readFileSync(join(sourcePath, 'logout.js'), 'utf8');
const updatedLogoutJs = logoutJs.replace(
  /NG_URL_121_SERVICE_API/g,
  process.env.NG_URL_121_SERVICE_API ?? '',
);
writeFileSync(join(targetPath, 'logout.js'), updatedLogoutJs);
console.info(`Logout API set at: ${process.env.NG_URL_121_SERVICE_API}`);

// Copy HTML
copyFileSync(join(sourcePath, 'index.html'), join(targetPath, 'index.html'));

console.info(`Manual Logout generated at: ${targetPath}`);
