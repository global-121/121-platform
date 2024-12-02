#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

const dotenv = require('dotenv');
const test = require('node:test');
const assert = require('node:assert/strict');

// Load environment-variables from .env file
dotenv.config({
  debug: process.env.DEBUG,
  override: process.env.DEBUG,
});

const config = require('./staticwebapp.config.json');

test('Deployment-configuration contains a Content-Security-Policy', () => {
  assert.ok(
    config.globalHeaders,
    'Contains configuration for global HTTP Headers',
  );
  assert.ok(
    config.globalHeaders['Content-Security-Policy'],
    'Contains configuration of a Content-Security-Policy',
  );
});

test('Content-Security-Policy configuration for Azure Entra SSO', () => {
  const csp = config.globalHeaders['Content-Security-Policy'];
  const connectSrcCondition =
    /connect-src[^;]* https:\/\/login\.microsoftonline\.com/;
  const frameSrcCondition =
    /frame-src[^;]* https:\/\/login\.microsoftonline\.com/;

  if (process.env.USE_SSO_AZURE_ENTRA === 'true') {
    assert.match(csp, connectSrcCondition);
    assert.match(csp, frameSrcCondition);
  } else {
    assert.doesNotMatch(csp, connectSrcCondition);
    assert.doesNotMatch(csp, frameSrcCondition);
  }
});

test('Content-Security-Policy configuration for loading as iframe in Twilio Flex', () => {
  const csp = config.globalHeaders['Content-Security-Policy'];
  const frameAncestorsCondition =
    /frame-ancestors[^;]* https:\/\/flex\.twilio\.com/;

  if (process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true') {
    assert.match(csp, frameAncestorsCondition);
  } else {
    assert.doesNotMatch(csp, frameAncestorsCondition);
  }
});

test('Content-Security-Policy configuration to load PowerBI dashboard(s) in iframe', () => {
  const csp = config.globalHeaders['Content-Security-Policy'];
  const frameSrcCondition = /frame-src[^;]* https:\/\/app\.powerbi\.com/;

  if (process.env.USE_POWERBI_DASHBOARDS === 'true') {
    assert.match(csp, frameSrcCondition);
  } else {
    assert.doesNotMatch(csp, frameSrcCondition);
  }
});
