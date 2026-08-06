import { expect, Locator } from '@playwright/test';

export const expectedSortedArraysToEqual = (
  actual: string[],
  expected: string[],
): void => {
  const sortedActual = [...actual].sort((a, b) => a.localeCompare(b));
  const sortedExpected = [...expected].sort((a, b) => a.localeCompare(b));

  expect(sortedActual).toEqual(sortedExpected);
};

export const validateComponentVisibility = ({
  component,
  visible,
}: {
  component: Locator;
  visible: boolean;
}) => {
  if (visible) {
    return expect(component).toBeVisible();
  } else {
    return expect(component).toBeHidden();
  }
};
