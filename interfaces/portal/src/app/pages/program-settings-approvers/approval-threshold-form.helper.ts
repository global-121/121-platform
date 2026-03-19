export interface ThresholdRow {
  thresholdAmount: null | number;
  userIds: number[];
}

export interface ThresholdRowErrors {
  thresholdAmount?: string;
  userIds?: string;
}

export interface ThresholdValidationResult {
  rowErrors: Partial<Record<number, ThresholdRowErrors>>;
  formError?: string;
}

/**
 * Validates the approval threshold form data.
 * Returns null when all data is valid.
 *
 * Validates:
 * - Each threshold amount is present (not null) and >= 0
 * - Threshold amounts are unique across all rows
 * - Each threshold has at least one approver
 * - At least one threshold has an amount of 0 (when any thresholds exist)
 */
export const validateApprovalThresholds = (
  thresholds: ThresholdRow[],
): null | ThresholdValidationResult => {
  const rowErrors: Partial<Record<number, ThresholdRowErrors>> = {};
  let formError: string | undefined;

  for (const [i, threshold] of thresholds.entries()) {
    const errors: ThresholdRowErrors = {};

    if (threshold.thresholdAmount === null) {
      errors.thresholdAmount = $localize`:@@generic-required-field:This field is required.`;
    } else if (threshold.thresholdAmount < 0) {
      errors.thresholdAmount = $localize`Amount must be 0 or greater.`;
    }

    if (threshold.userIds.length === 0) {
      errors.userIds = $localize`At least one approver is required.`;
    }

    if (Object.keys(errors).length > 0) {
      rowErrors[i] = errors;
    }
  }

  // Cross-row: uniqueness of threshold amounts (only validate non-null amounts)
  const amountIndexMap = new Map<number, number[]>();
  for (const [i, threshold] of thresholds.entries()) {
    const { thresholdAmount } = threshold;
    if (thresholdAmount !== null) {
      const existing = amountIndexMap.get(thresholdAmount) ?? [];
      amountIndexMap.set(thresholdAmount, [...existing, i]);
    }
  }

  for (const [, indices] of amountIndexMap) {
    if (indices.length > 1) {
      for (const idx of indices) {
        rowErrors[idx] = {
          ...rowErrors[idx],
          thresholdAmount: $localize`Threshold amounts must be unique.`,
        };
      }
    }
  }

  // Form-level: at least one threshold with amount 0 (when thresholds exist)
  if (thresholds.length > 0) {
    const hasZeroThreshold = thresholds.some((t) => t.thresholdAmount === 0);
    if (!hasZeroThreshold) {
      formError = $localize`At least one threshold must have an amount of 0 to cover all payments.`;
    }
  }

  const hasRowErrors = Object.keys(rowErrors).length > 0;
  if (!hasRowErrors && !formError) {
    return null;
  }

  return { rowErrors, formError };
};
