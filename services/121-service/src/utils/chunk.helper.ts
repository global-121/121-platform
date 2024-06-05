/**
 * Splits an array into chunks of a specified size. This function is useful for processing large arrays in smaller batches,
 * reducing the load on resources or adapting to API rate limits.
 *
 * @param array - The array to be chunked into smaller arrays.
 * @param chunkSize - The maximum size of each chunk. The last chunk may be smaller if the array cannot be divided evenly.
 * @returns An array of chunks, where each chunk is an array of elements from the original array. The size of each chunk
 */
export function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}
