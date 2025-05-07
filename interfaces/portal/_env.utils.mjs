/**
 * Determines if a given environment variable/"feature flag" should be considered enabled.
 *
 * @param {string | undefined} envVariable - The environment variable to check.
 * @returns {boolean} - Returns `true` if the environment variable matches any of the enabled values, otherwise `false`.
 */
export const shouldBeEnabled = (envVariable) => {
  const enabledValues = [
    'true',
    '1',
    'y',
    'yes',
    'yep',
    'on',
    'enabled',
    'enable',
  ];
  return !!envVariable && enabledValues.includes(envVariable.toLowerCase());
};
