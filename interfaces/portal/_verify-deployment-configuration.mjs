#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

import { doesNotMatch, match, ok } from 'node:assert/strict';
import test from 'node:test';

import { shouldBeEnabled } from './_env.utils.mjs';
import { parseMatomoConnectionString } from './_matomo.utils.mjs';

const url = process.argv[2]?.replace('--url=', '');

if (!url || !url.startsWith('https')) {
  console.error('Invalid URL argument.');
  console.info(
    'Provide a valid URL as argument using: ` --url=https://example.org`',
  );
  process.exit(1);
}

console.info('Verifying deployment configuration for URL:', url);
const response = await fetch(url);

const csp = response.headers.get('Content-Security-Policy') ?? '';
console.info('Content-Security-Policy in use:', csp);

test('Response-Headers contain a Content-Security-Policy', () => {
  ok(csp, 'Contain a Content-Security-Policy');
});

test('Content-Security-Policy contains defaults', () => {
  const defaults = [
    `default-src 'self'`,
    `connect-src 'self'`,
    `img-src data: 'self'`,
    `object-src 'none'`,
    `style-src 'self' 'unsafe-inline'`,
  ];

  defaults.forEach((defaultDirective) =>
    match(csp, new RegExp(defaultDirective)),
  );
});

test('Content-Security-Policy set for tracking with ApplicationInsights', () => {
  const connectSrcCondition =
    /connect-src[^;]* https:\/\/\*\.in\.applicationinsights\.azure\.com/;

  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    match(csp, connectSrcCondition);
  } else {
    doesNotMatch(csp, connectSrcCondition);
  }
});

test('Content-Security-Policy set for Azure Entra SSO', () => {
  const connectSrcCondition =
    /connect-src[^;]* https:\/\/login\.microsoftonline\.com/;
  const frameSrcCondition =
    /frame-src[^;]* https:\/\/login\.microsoftonline\.com/;

  if (shouldBeEnabled(process.env.USE_SSO_AZURE_ENTRA)) {
    match(csp, connectSrcCondition);
    match(csp, frameSrcCondition);
  } else {
    doesNotMatch(csp, connectSrcCondition);
    doesNotMatch(csp, frameSrcCondition);
  }
});

test('Content-Security-Policy set for loading as iframe in Twilio Flex', () => {
  const frameAncestorsCondition =
    /frame-ancestors[^;]* https:\/\/flex\.twilio\.com/;

  if (shouldBeEnabled(process.env.USE_IN_TWILIO_FLEX_IFRAME)) {
    match(csp, frameAncestorsCondition);
  } else {
    doesNotMatch(csp, frameAncestorsCondition);
  }
});

test('Content-Security-Policy set for loading as iframe in AWS Connect', () => {
  const frameAncestorsCondition =
    /frame-ancestors[^;]* https:\/\/nlrc-poc\.my\.connect\.aws/;

  if (shouldBeEnabled(process.env.USE_IN_AWS_CONNECT_IFRAME)) {
    match(csp, frameAncestorsCondition);
  } else {
    doesNotMatch(csp, frameAncestorsCondition);
  }
});

test('Configuration set to control pop-ups for SSO when the Portal is in an iframe on Twilio Flex', () => {
  const openerPolicy = response.headers.get('Cross-Origin-Opener-Policy') ?? '';

  if (
    shouldBeEnabled(process.env.USE_SSO_AZURE_ENTRA) &&
    (shouldBeEnabled(process.env.USE_IN_TWILIO_FLEX_IFRAME) ||
      shouldBeEnabled(process.env.USE_IN_AWS_CONNECT_IFRAME))
  ) {
    match(openerPolicy, /unsafe-none/);
  } else {
    match(openerPolicy, /same-origin/);
  }
});

test('Content-Security-Policy set to load PowerBI dashboard(s) in iframe', () => {
  const frameSrcCondition = /frame-src[^;]* https:\/\/app\.powerbi\.com/;

  if (shouldBeEnabled(process.env.USE_POWERBI_DASHBOARDS)) {
    match(csp, frameSrcCondition);
  } else {
    doesNotMatch(csp, frameSrcCondition);
  }
});

test(
  'Content-Security-Policy set for tracking with Matomo',
  { skip: !process.env.MATOMO_CONNECTION_STRING },
  () => {
    const matomoConnectionInfo = parseMatomoConnectionString(
      process.env.MATOMO_CONNECTION_STRING,
    );

    const matomoApiOrigin = new URL(matomoConnectionInfo.api).origin;
    const connectSrcCondition = new RegExp(
      `connect-src[^;]* ${matomoApiOrigin}`,
    );
    match(csp, connectSrcCondition);

    const matomoSdkOrigin = new URL(matomoConnectionInfo.sdk).origin;
    const scriptSrcCondition = new RegExp(`script-src[^;]* ${matomoSdkOrigin}`);
    match(csp, scriptSrcCondition);
  },
);
