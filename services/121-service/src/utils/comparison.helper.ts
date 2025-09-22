/**
 * Compares if two (status-) codes are _equivalent_, not taking types into account.
 * @example isSameAsString('200', 200) returns true
 */
export function isSameAsString(
  a: number | string | undefined,
  b: number | string | undefined,
): boolean {
  return String(a) === String(b);
}
