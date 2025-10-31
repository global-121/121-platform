/**
 * Sorts an array of strings alphabetically.
 *
 * Copies the array before sorting to avoid mutating the original array.
 *
 * @param {string[]} array - An array of strings to sort.
 * @returns {string[]} - The sorted array of strings.
 */
export function sortStringsAlphabeticSimple(array: string[]): string[] {
  return array.slice().sort((a, b) => a.localeCompare(b));
}
