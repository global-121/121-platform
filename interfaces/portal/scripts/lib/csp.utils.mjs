/**
 * Extract tokens for a specific directive from a Content-Security-Policy string.
 *
 * @param {string | undefined} csp - Full Content-Security-Policy string to parse.
 * @param {string} directiveName - Name of the directive to extract tokens from.
 * @returns {string[]} - Array of tokens for the specified directive.
 */
export const getDirectiveTokens = (csp, directiveName) => {
  if (!csp) {
    return [];
  }

  const directives = csp
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  const directive = directives.find(
    (part) => part.split(/\s+/)[0] === directiveName,
  );

  if (!directive) {
    return [];
  }

  const [, ...tokens] = directive.split(/\s+/);

  return tokens;
};

/**
 * Checks whether the specified directive contains the expected token.
 *
 * @param {string | undefined} csp - Full Content-Security-Policy string to parse.
 * @param {string} directiveName - Name of the directive to check.
 * @param {string} expectedToken - Token to check for in the directive.
 * @returns {boolean} - True if the expected token is present in the directive, false otherwise.
 */
export const hasExactToken = (csp, directiveName, expectedToken) =>
  getDirectiveTokens(csp, directiveName).includes(expectedToken);
