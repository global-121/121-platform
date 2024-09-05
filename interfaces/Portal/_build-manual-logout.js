#!/usr/bin/env node

/**
 * See the README.md-file in `./src/logout/` for more information.
 */

const fs = require('fs');
const dotenv = require('dotenv');

// Load environment-variables from .env file
dotenv.config({
  debug: process.env.DEBUG,
});

// Set up specifics
const sourcePath = `./src/logout/`;
const targetPath = `./www/logout/`;

// Create target
if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath);
}

// Set current API-URL from "NG_URL_121_SERVICE_API"
const logoutJs = fs.readFileSync(`${sourcePath}logout.js`, 'utf8');
const updatedLogoutJs = logoutJs.replace(
  /NG_URL_121_SERVICE_API/g,
  process.env.NG_URL_121_SERVICE_API,
);
fs.writeFileSync(`${targetPath}logout.js`, updatedLogoutJs);
console.info(`Logout API set at: ${process.env.NG_URL_121_SERVICE_API}`);

// Copy HTML
fs.copyFileSync(`${sourcePath}index.html`, `${targetPath}index.html`);

console.info(`Manual Logout generated at: ${targetPath}`);
