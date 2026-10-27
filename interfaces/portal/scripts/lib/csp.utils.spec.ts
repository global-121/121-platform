import { equal, deepEqual } from 'node:assert/strict';
import { getDirectiveTokens, hasExactToken } from 'scripts/lib/csp.utils.mjs';
import { describe, it } from 'vitest';

describe('CSP-Util: getDirectiveTokens', () => {
  it('should return an empty list for an empty CSP', () => {
    deepEqual(getDirectiveTokens('', 'script-src'), []);
  });

  it('should return an empty list when the directive is missing', () => {
    deepEqual(getDirectiveTokens("default-src 'self'", 'script-src'), []);
  });

  it('should return the tokens without the directive name', () => {
    deepEqual(
      getDirectiveTokens("script-src 'self' https://a.example", 'script-src'),
      ["'self'", 'https://a.example'],
    );
  });

  it('should support multiple directives separated by " ; "', () => {
    const csp = "default-src 'self' ; script-src https://a.example ; img-src *";
    deepEqual(getDirectiveTokens(csp, 'script-src'), ['https://a.example']);
    deepEqual(getDirectiveTokens(csp, 'img-src'), ['*']);
  });
});

describe('CSP-Util: hasExactToken', () => {
  const csp =
    "default-src 'self' ; connect-src 'self' https://matomo.example.org ; script-src https://sdk.example.org";

  it('should return false for an empty CSP', () => {
    equal(
      hasExactToken('', 'connect-src', 'https://matomo.example.org'),
      false,
    );
  });

  it('should return false when the directive is missing', () => {
    equal(
      hasExactToken(csp, 'frame-ancestors', 'https://matomo.example.org'),
      false,
    );
  });

  it('should return true for an exact match', () => {
    equal(
      hasExactToken(csp, 'connect-src', 'https://matomo.example.org'),
      true,
    );
  });

  it('should only look in the requested directive', () => {
    equal(
      hasExactToken(csp, 'script-src', 'https://matomo.example.org'),
      false,
    );
  });

  it('should not match a suffix-attack origin', () => {
    const attackCsp = 'connect-src https://matomo.example.org.evil.example';
    equal(
      hasExactToken(attackCsp, 'connect-src', 'https://matomo.example.org'),
      false,
    );
  });

  it('should not match a prefix-attack origin', () => {
    const attackCsp = 'connect-src https://evil.https://matomo.example.org';
    equal(
      hasExactToken(attackCsp, 'connect-src', 'https://matomo.example.org'),
      false,
    );
    const prefixCsp = 'connect-src https://evil-matomo.example.org';
    equal(
      hasExactToken(prefixCsp, 'connect-src', 'https://matomo.example.org'),
      false,
    );
  });
});
