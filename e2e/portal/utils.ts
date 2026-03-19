import { expect } from '@playwright/test';

export const expectedSortedArraysToEqual = (
  actual: string[],
  expected: string[],
): void => {
  const sortedActual = [...actual].sort((a, b) => a.localeCompare(b));
  const sortedExpected = [...expected].sort((a, b) => a.localeCompare(b));

  expect(sortedActual).toEqual(sortedExpected);
};
