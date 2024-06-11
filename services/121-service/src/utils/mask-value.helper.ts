/**
 * Masks a `value` by replacing all characters with '*' except for the FIRST `length` characters
 *
 * @param value A value that potentially contains sensitive information
 * @param length Number of characters to keep unmasked (at the START of the input value)
 * @returns The masked string
 */
export function maskValueKeepStart(value: string, length = 0): string {
  if (!value) {
    return '';
  }

  return value.substring(0, length).padEnd(value.length, '*');
}

/**
 * Masks a `value` by replacing all characters with '*' except for the LAST `length` characters
 *
 * @param value A value that potentially contains sensitive information
 * @param length Number of characters to keep unmasked (at the END of the input value)
 * @returns The masked string
 */
export function maskValueKeepEnd(value: string, length = 0): string {
  if (!value) {
    return '';
  }

  return value.substring(value.length - length).padStart(value.length, '*');
}
