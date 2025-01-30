#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment-variables from .env file
config({
  debug: process.env.DEBUG,
  override: process.env.DEBUG,
});

// Set up specifics
const sourcePath = './staticwebapp.config.base.json';
const targetPath = './staticwebapp.config.json';

let swaConfig = JSON.parse(readFileSync(sourcePath, 'utf8'));

// Check source/base
if (!existsSync(sourcePath) || !swaConfig) {
  console.error(`Source-file not found or readable: ${sourcePath}`);
  process.exit(1);
}

if (!swaConfig.globalHeaders) {
  swaConfig.globalHeaders = {};
}

// NOTE: All values in each array are written as template-strings, as the use of single-quotes around some values (i.e. 'self') is mandatory and will affect the working of the HTTP-Header.
let contentSecurityPolicy = new Map([
  ['default-src', [`'self'`]],
  ['connect-src', [`'self'`]],
  ['frame-ancestors', [`'self'`]],
  ['frame-src', [`blob:`, `'self'`]],
  ['img-src', [`data:`, `'self'`]],
  ['object-src', [`'none'`]],
  ['style-src', [`'self'`, `'unsafe-inline'`]],
]);

// Set API-origin
if (process.env.NG_URL_121_SERVICE_API) {
  console.info('✅ Set API-origin of the 121-service');

  const apiUrl = new URL(process.env.NG_URL_121_SERVICE_API);

  let connectSrc = contentSecurityPolicy.get('connect-src');
  contentSecurityPolicy.set('connect-src', [...connectSrc, apiUrl.origin]);
}

// Feature: Application-Insights logging
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  console.info('✅ Allow logging to Application Insights');

  let connectSrc = contentSecurityPolicy.get('connect-src');
  contentSecurityPolicy.set('connect-src', [
    ...connectSrc,
    'https://*.in.applicationinsights.azure.com',
    'https://westeurope.livediagnostics.monitor.azure.com',
  ]);
}

// Feature: Azure Entra SSO
if (process.env.USE_SSO_AZURE_ENTRA === 'true') {
  console.info('✅ Allow use of Azure Entra endpoints and iframe(s)');

  let connectSrc = contentSecurityPolicy.get('connect-src');
  contentSecurityPolicy.set('connect-src', [
    ...connectSrc,
    `https://login.microsoftonline.com`,
  ]);

  let frameSrc = contentSecurityPolicy.get('frame-src');
  contentSecurityPolicy.set('frame-src', [
    ...frameSrc,
    `https://login.microsoftonline.com`,
  ]);
}

// Feature: Twilio Flex
if (process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true') {
  console.info('✅ Allow loading the Portal in an iframe on Twilio Flex');

  let frameAncestors = contentSecurityPolicy.get('frame-ancestors');
  contentSecurityPolicy.set('frame-ancestors', [
    ...frameAncestors,
    `https://flex.twilio.com`,
  ]);
}

if (
  process.env.USE_SSO_AZURE_ENTRA === 'true' &&
  process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true'
) {
  console.info(
    '✅ Allow control of pop-ups for SSO when the Portal is in an iframe on Twilio Flex',
  );

  swaConfig.globalHeaders['Cross-Origin-Opener-Policy'] = 'unsafe-none';
}

// Feature: PowerBI Dashboard(s)
if (process.env.USE_POWERBI_DASHBOARDS === 'true') {
  console.info('✅ Allow loading Power BI-dashboards');

  let frameSrc = contentSecurityPolicy.get('frame-src');
  contentSecurityPolicy.set('frame-src', [
    ...frameSrc,
    `https://app.powerbi.com`,
  ]);
}

// Construct the Content-Security-Policy header-value
const contentSecurityPolicyValue = Array.from(contentSecurityPolicy)
  .map((directive) => {
    const directiveKey = directive[0];
    const values = directive[1];
    return `${directiveKey} ${values.join(' ')}`;
  })
  .join(' ; ');

// Set the Content-Security-Policy header-value
if (process.env.DEBUG) {
  console.log(`Content-Security-Policy: "${contentSecurityPolicyValue}"`);
}
swaConfig.globalHeaders['Content-Security-Policy'] = contentSecurityPolicyValue;

// Write result
const swaConfigFile = JSON.stringify(swaConfig, null, 2);
writeFileSync(targetPath, swaConfigFile);
console.info(`✅ Deployment configuration written at: ${targetPath}`);
console.log(swaConfigFile);
