#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

import test from 'node:test';
import { ok, match, doesNotMatch } from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

test('Content-Security-Policy configuration for Azure Entra SSO', () => {
  const connectSrcCondition =
    /connect-src[^;]* https:\/\/login\.microsoftonline\.com/;
  const frameSrcCondition =
    /frame-src[^;]* https:\/\/login\.microsoftonline\.com/;

  if (process.env.USE_SSO_AZURE_ENTRA === 'true') {
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

  if (process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true') {
    match(csp, frameAncestorsCondition);
  } else {
    doesNotMatch(csp, frameAncestorsCondition);
  }
});

test('Configuration to control pop-ups for SSO when the Portal is in an iframe on Twilio Flex', () => {
  const openerPolicy = swaConfig.globalHeaders['Cross-Origin-Opener-Policy'];

  if (
    process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true' &&
    process.env.USE_SSO_AZURE_ENTRA === 'true'
  ) {
    match(openerPolicy, /unsafe-none/);
  } else {
    match(openerPolicy, /same-origin/);
  }
});

test('Content-Security-Policy configuration to load PowerBI dashboard(s) in iframe', () => {
  const frameSrcCondition = /frame-src[^;]* https:\/\/app\.powerbi\.com/;

  if (process.env.USE_POWERBI_DASHBOARDS === 'true') {
    match(csp, frameSrcCondition);
  } else {
    doesNotMatch(csp, frameSrcCondition);
  }
});
