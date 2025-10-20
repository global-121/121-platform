#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

import { doesNotMatch, match, ok } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { shouldBeEnabled } from './_env.utils.mjs';
import { parseMatomoConnectionString } from './_matomo.utils.mjs';

const swaConfig = JSON.parse(
  readFileSync('./staticwebapp.config.json', 'utf8'),
);

const csp = swaConfig.globalHeaders['Content-Security-Policy'];

test('Deployment-configuration contains a Content-Security-Policy', () => {
  ok(swaConfig.globalHeaders, 'Contains configuration for global HTTP Headers');
  ok(
    swaConfig.globalHeaders['Content-Security-Policy'],
    'Contains configuration of a Content-Security-Policy',
  );
});

test('Deployment-configuration contains the defaults of the Content-Security-Policy', () => {
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

test('Content-Security-Policy configuration whether to allow tracking with ApplicationInsights', () => {
  const connectSrcCondition =
    /connect-src[^;]* https:\/\/\*\.in\.applicationinsights\.azure\.com/;

  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    match(csp, connectSrcCondition);
  } else {
    doesNotMatch(csp, connectSrcCondition);
  }
});

test('Content-Security-Policy configuration for Azure Entra SSO', () => {
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

test('Content-Security-Policy configuration for loading as iframe in Twilio Flex', () => {
  const frameAncestorsCondition =
    /frame-ancestors[^;]* https:\/\/flex\.twilio\.com/;

  if (shouldBeEnabled(process.env.USE_IN_TWILIO_FLEX_IFRAME)) {
    match(csp, frameAncestorsCondition);
  } else {
    doesNotMatch(csp, frameAncestorsCondition);
  }
});

test('Content-Security-Policy configuration for loading as iframe in AWS Connect', () => {
  const frameAncestorsCondition =
    /frame-ancestors[^;]* https:\/\/nlrc-poc\.my\.connect\.aws/;

  if (shouldBeEnabled(process.env.USE_IN_AWS_CONNECT_IFRAME)) {
    match(csp, frameAncestorsCondition);
  } else {
    doesNotMatch(csp, frameAncestorsCondition);
  }
});

test('Configuration to control pop-ups for SSO when the Portal is in an iframe on Twilio Flex', () => {
  const openerPolicy = swaConfig.globalHeaders['Cross-Origin-Opener-Policy'];

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

test('Content-Security-Policy configuration to load PowerBI dashboard(s) in iframe', () => {
  const frameSrcCondition = /frame-src[^;]* https:\/\/app\.powerbi\.com/;

  if (shouldBeEnabled(process.env.USE_POWERBI_DASHBOARDS)) {
    match(csp, frameSrcCondition);
  } else {
    doesNotMatch(csp, frameSrcCondition);
  }
});

test(
  'Content-Security-Policy configuration whether to allow tracking with Matomo',
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
