import { sortBy } from 'lodash';

/**
 * @example: Usage: dateSort(dates, obj => obj.a.b.date);
 */
export function dateSort<T>(
  array: T[],
  dateAccessor: (obj: T) => Date | string | number,
): T[] {
  return sortBy(array, (obj) => new Date(dateAccessor(obj)).getTime());
}
