export const getDirectiveTokens = (csp, directiveName) => {
  if (!csp) {
    return [];
  }

  const directives = csp
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  const directive = directives.find((part) =>
    part.startsWith(`${directiveName} `),
  );

  if (!directive) {
    return [];
  }

  const [, ...tokens] = directive.split(/\s+/);

  return tokens;
};

export const hasExactToken = (csp, directiveName, expectedToken) =>
  getDirectiveTokens(csp, directiveName).includes(expectedToken);
