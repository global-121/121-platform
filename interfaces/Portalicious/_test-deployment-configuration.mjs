#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

import { config } from 'dotenv';
import test from 'node:test';
import { ok, match, doesNotMatch } from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Load environment-variables from .env file
config({
  debug: process.env.DEBUG,
  override: process.env.DEBUG,
});

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

test('Content-Security-Policy configuration to load PowerBI dashboard(s) in iframe', () => {
  const frameSrcCondition = /frame-src[^;]* https:\/\/app\.powerbi\.com/;

  if (process.env.USE_POWERBI_DASHBOARDS === 'true') {
    match(csp, frameSrcCondition);
  } else {
    doesNotMatch(csp, frameSrcCondition);
  }
});
