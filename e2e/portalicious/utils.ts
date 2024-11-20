import { expect } from '@playwright/test';

export function expectedSortedArraysToEqual(
  actual: string[],
  expected: string[],
): void {
  expect(actual).toHaveLength(expected.length);

  const sortedActual = [...actual].sort((a, b) => a.localeCompare(b));
  const sortedExpected = [...expected].sort((a, b) => a.localeCompare(b));

  expect(sortedActual).toEqual(sortedExpected);
}
