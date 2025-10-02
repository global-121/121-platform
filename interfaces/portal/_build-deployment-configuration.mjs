#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';

import { shouldBeEnabled } from './_env.utils.mjs';
import { parseMatomoConnectionString } from './_matomo.utils.mjs';

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
  ['connect-src', [`'self'`]],
  ['default-src', [`'self'`]],
  ['frame-ancestors', [`'self'`]],
  ['frame-src', [`blob:`, `'self'`]],
  ['img-src', [`data:`, `'self'`]],
  ['object-src', [`'none'`]],
  ['script-src', [`'self'`]],
  ['style-src', [`'self'`, `'unsafe-inline'`]],
]);

// Required: Set API-origin
if (process.env.NG_URL_121_SERVICE_API) {
  console.info('✅ Set API-origin of the 121-service');

  const apiUrl = new URL(process.env.NG_URL_121_SERVICE_API);

  let connectSrc = contentSecurityPolicy.get('connect-src') ?? [];
  contentSecurityPolicy.set('connect-src', [...connectSrc, apiUrl.origin]);
}

// Optional: Application-Insights logging
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  console.info('✅ Allow logging to Application Insights');

  let connectSrc = contentSecurityPolicy.get('connect-src') ?? [];
  contentSecurityPolicy.set('connect-src', [
    ...connectSrc,
    'https://*.in.applicationinsights.azure.com',
    'https://westeurope.livediagnostics.monitor.azure.com',
  ]);
}

// Optional: Azure Entra SSO
if (shouldBeEnabled(process.env.USE_SSO_AZURE_ENTRA)) {
  console.info('✅ Allow use of Azure Entra endpoints and iframe(s)');

  let connectSrc = contentSecurityPolicy.get('connect-src') ?? [];
  contentSecurityPolicy.set('connect-src', [
    ...connectSrc,
    `https://login.microsoftonline.com`,
  ]);

  let frameSrc = contentSecurityPolicy.get('frame-src') ?? [];
  contentSecurityPolicy.set('frame-src', [
    ...frameSrc,
    `https://login.microsoftonline.com`,
  ]);
}

// Optional: Twilio Flex
if (shouldBeEnabled(process.env.USE_IN_TWILIO_FLEX_IFRAME)) {
  console.info('✅ Allow loading the Portal in an iframe on Twilio Flex');

  let frameAncestors = contentSecurityPolicy.get('frame-ancestors') ?? [];
  contentSecurityPolicy.set('frame-ancestors', [
    ...frameAncestors,
    `https://flex.twilio.com`,
  ]);
}

// Optional: Aws Connect
if (shouldBeEnabled(process.env.USE_IN_AWS_CONNECT_IFRAME)) {
  console.info('✅ Allow loading the Portal in an iframe on Aws Connect');

  let frameAncestors = contentSecurityPolicy.get('frame-ancestors') ?? [];
  contentSecurityPolicy.set('frame-ancestors', [
    ...frameAncestors,
    'https://nlrc-poc.my.connect.aws',
  ]);
}

// Depending on: Using "Azure Entra SSO" AND "Twilio Flex"
if (
  shouldBeEnabled(process.env.USE_SSO_AZURE_ENTRA) &&
  shouldBeEnabled(process.env.USE_IN_TWILIO_FLEX_IFRAME)
) {
  console.info(
    '✅ Allow control of pop-ups for SSO when the Portal is in an iframe on Twilio Flex',
  );

  swaConfig.globalHeaders['Cross-Origin-Opener-Policy'] = 'unsafe-none';
}

// Optional: PowerBI Dashboard(s)
if (shouldBeEnabled(process.env.USE_POWERBI_DASHBOARDS)) {
  console.info('✅ Allow loading Power BI-dashboards');

  let frameSrc = contentSecurityPolicy.get('frame-src') ?? [];
  contentSecurityPolicy.set('frame-src', [
    ...frameSrc,
    `https://app.powerbi.com`,
  ]);
}

// Optional: Matomo analytics/metrics
if (process.env.MATOMO_CONNECTION_STRING) {
  console.info('✅ Allow tracking with Matomo');

  const matomoConnectionInfo = parseMatomoConnectionString(
    process.env.MATOMO_CONNECTION_STRING,
  );

  if (matomoConnectionInfo && matomoConnectionInfo.api) {
    const matomoApiOrigin = new URL(matomoConnectionInfo.api).origin;
    let connectSrc = contentSecurityPolicy.get('connect-src') ?? [];
    contentSecurityPolicy.set('connect-src', [...connectSrc, matomoApiOrigin]);
  }

  if (matomoConnectionInfo && matomoConnectionInfo.sdk) {
    const matomoSdkOrigin = new URL(matomoConnectionInfo.sdk).origin;
    let scriptSrc = contentSecurityPolicy.get('script-src') ?? [];
    contentSecurityPolicy.set('script-src', [...scriptSrc, matomoSdkOrigin]);
  }
}

/////////////////////////////////////////////////////////////////////////////

// Construct the Content-Security-Policy header-value
const contentSecurityPolicyValue = Array.from(contentSecurityPolicy)
  .map((directive) => {
    const directiveKey = directive[0];
    const values = directive[1];
    return `${directiveKey} ${values.join(' ')}`;
  })
  .join(' ; ');

// Set the Content-Security-Policy header-value
if (shouldBeEnabled(process.env.DEBUG)) {
  console.log(`Content-Security-Policy: "${contentSecurityPolicyValue}"`);
}
swaConfig.globalHeaders['Content-Security-Policy'] = contentSecurityPolicyValue;

// Write result
const swaConfigFile = JSON.stringify(swaConfig, null, 2);
writeFileSync(targetPath, swaConfigFile);
console.info(`✅ Deployment configuration written at: ${targetPath}`);
console.log(swaConfigFile);
