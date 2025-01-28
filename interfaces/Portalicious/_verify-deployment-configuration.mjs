#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

import { config } from 'dotenv';
import test from 'node:test';
import { ok, match, doesNotMatch } from 'node:assert/strict';

// Load environment-variables from .env file
config({
  debug: process.env.DEBUG,
  override: process.env.DEBUG,
});

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

const csp = response.headers.get('Content-Security-Policy');
console.info('Content-Security-Policy in use:', csp);

test('Response-Headers contain a Content-Security-Policy', () => {
  ok(
    response.headers.get('Content-Security-Policy'),
    'Contain a Content-Security-Policy',
  );
});

test('Content-Security-Policy set for Azure Entra SSO', () => {
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

test('Content-Security-Policy set for loading as iframe in Twilio Flex', () => {
  const frameAncestorsCondition =
    /frame-ancestors[^;]* https:\/\/flex\.twilio\.com/;

  if (process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true') {
    match(csp, frameAncestorsCondition);
  } else {
    doesNotMatch(csp, frameAncestorsCondition);
  }
});

test('Configuration set to control pop-ups for SSO when the Portal is in an iframe on Twilio Flex', () => {
  const openerPolicy = response.headers.get('Cross-Origin-Opener-Policy');

  if (
    process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true' &&
    process.env.USE_SSO_AZURE_ENTRA === 'true'
  ) {
    match(openerPolicy, /unsafe-none/);
  } else {
    match(openerPolicy, /same-origin/);
  }
});

test('Content-Security-Policy set to load PowerBI dashboard(s) in iframe', () => {
  const frameSrcCondition = /frame-src[^;]* https:\/\/app\.powerbi\.com/;

  if (process.env.USE_POWERBI_DASHBOARDS === 'true') {
    match(csp, frameSrcCondition);
  } else {
    doesNotMatch(csp, frameSrcCondition);
  }
});
