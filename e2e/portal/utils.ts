import { expect, Locator } from '@playwright/test';
import { addMinutes, format } from 'date-fns';

export const expectedSortedArraysToEqual = (
  actual: string[],
  expected: string[],
): void => {
  const sortedActual = [...actual].sort((a, b) => a.localeCompare(b));
  const sortedExpected = [...expected].sort((a, b) => a.localeCompare(b));

  expect(sortedActual).toEqual(sortedExpected);
};

export const generateTimestampsWithGrace = ({
  startDate,
  formatPattern,
  graceMinutes,
}: {
  startDate: Date;
  formatPattern: string;
  graceMinutes: number;
}): string[] => {
  const timestamps: string[] = [];

  for (let minuteOffset = 0; minuteOffset <= graceMinutes; minuteOffset++) {
    const targetDate = addMinutes(startDate, minuteOffset);
    timestamps.push(format(targetDate, formatPattern));
  }

  return [...new Set(timestamps)];
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
