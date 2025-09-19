/**
 * Compares if two (status-) codes are _equivalent_, not taking types into account.
 * @example isSameStatus('200', 200) returns true
 */
export function isSameStatus(
  a: number | string | undefined,
  b: number | string | undefined,
): boolean {
  return String(a) === String(b);
}
