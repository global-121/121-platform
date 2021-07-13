/**
 * Returns the output of `getValueToShow()` if `checkValue` is available or defined.
 * Otherwise, returns fallback-value: '-'
 */
export function getValueOrEmpty(
  checkValue: any,
  getValueToShow?: (value?: any) => number | string,
) {
  return getValueOrFallback('-', checkValue, getValueToShow);
}

/**
 * Returns the output of `getValueToShow()` if `checkValue` is available or defined.
 * Otherwise, returns fallback-value: '?'
 */
export function getValueOrUnknown(
  checkValue: any,
  getValueToShow?: (value?: any) => number | string,
) {
  return getValueOrFallback('?', checkValue, getValueToShow);
}

/**
 * Returns the output of `getValueToShow()` if `checkValue` is available or defined.
 * Otherwise, returns fallback-value
 */
export function getValueOrFallback(
  fallbackValue: number | string,
  checkValue: any,
  getValueToShow?: (value?: any) => number | string,
) {
  // If there is nothing sensible to display, show the fallback:
  if (typeof checkValue === 'undefined') {
    return fallbackValue;
  }

  // If available, use `getValueToShow()` to get 'something to display':
  if (typeof getValueToShow === 'function') {
    return getValueToShow(checkValue);
  }

  // If all else fails, just return checkValue to display:
  return checkValue;
}
