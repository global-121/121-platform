/**
 * Masks a `value` by replacing all characters with '*' except for the FIRST `length` characters
 *
 * @param value A value that potentially contains sensitive information
 * @param length Number of characters to keep unmasked (at the START of the input value)
 * @returns The masked string
 */
export function maskValueStart(value: string, length = 0): string {
  if (!value) {
    return '';
  }

  return value.substring(0, length).padEnd(value.length, '*');
}
