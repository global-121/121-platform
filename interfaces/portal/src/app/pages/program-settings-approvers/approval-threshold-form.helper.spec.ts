import {
  ThresholdRow,
  validateApprovalThresholds,
} from '~/pages/program-settings-approvers/approval-threshold-form.helper';

describe('validateApprovalThresholds', () => {
  const validThresholds: ThresholdRow[] = [
    { thresholdAmount: 0, userIds: [1] },
    { thresholdAmount: 1000, userIds: [2] },
  ];

  it('should return null for valid thresholds', () => {
    const result = validateApprovalThresholds(validThresholds);

    expect(result).toBeNull();
  });

  it('should return null for empty thresholds array', () => {
    const result = validateApprovalThresholds([]);

    expect(result).toBeNull();
  });

  it('should return error when threshold amount is null', () => {
    const thresholds: ThresholdRow[] = [
      { thresholdAmount: null, userIds: [1] },
    ];

    const result = validateApprovalThresholds(thresholds);

    expect(result).not.toBeNull();
    expect(result?.rowErrors[0]?.thresholdAmount).toBeDefined();
  });

  it('should return error when threshold amount is negative', () => {
    const thresholds: ThresholdRow[] = [{ thresholdAmount: -5, userIds: [1] }];

    const result = validateApprovalThresholds(thresholds);

    expect(result).not.toBeNull();
    expect(result?.rowErrors[0]?.thresholdAmount).toBeDefined();
  });

  it('should return error when threshold amounts are not unique', () => {
    const thresholds: ThresholdRow[] = [
      { thresholdAmount: 0, userIds: [1] },
      { thresholdAmount: 0, userIds: [2] },
    ];

    const result = validateApprovalThresholds(thresholds);

    expect(result).not.toBeNull();
    expect(result?.rowErrors[0]?.thresholdAmount).toBeDefined();
    expect(result?.rowErrors[1]?.thresholdAmount).toBeDefined();
  });

  it('should return error when a threshold has no approvers', () => {
    const thresholds: ThresholdRow[] = [{ thresholdAmount: 0, userIds: [] }];

    const result = validateApprovalThresholds(thresholds);

    expect(result).not.toBeNull();
    expect(result?.rowErrors[0]?.userIds).toBeDefined();
  });

  it('should return form-level error when no threshold has amount of 0', () => {
    const thresholds: ThresholdRow[] = [
      { thresholdAmount: 500, userIds: [1] },
      { thresholdAmount: 1000, userIds: [2] },
    ];

    const result = validateApprovalThresholds(thresholds);

    expect(result).not.toBeNull();
    expect(result?.formError).toBeDefined();
  });

  it('should not return form-level error when one threshold has amount of 0', () => {
    const thresholds: ThresholdRow[] = [
      { thresholdAmount: 0, userIds: [1] },
      { thresholdAmount: 500, userIds: [2] },
    ];

    const result = validateApprovalThresholds(thresholds);

    expect(result).toBeNull();
  });

  it('should return multiple errors for the same row', () => {
    const thresholds: ThresholdRow[] = [{ thresholdAmount: null, userIds: [] }];

    const result = validateApprovalThresholds(thresholds);

    expect(result).not.toBeNull();
    expect(result?.rowErrors[0]?.thresholdAmount).toBeDefined();
    expect(result?.rowErrors[0]?.userIds).toBeDefined();
  });

  it('should only flag rows with duplicate amounts (not all rows)', () => {
    const thresholds: ThresholdRow[] = [
      { thresholdAmount: 0, userIds: [1] },
      { thresholdAmount: 500, userIds: [2] },
      { thresholdAmount: 500, userIds: [3] },
    ];

    const result = validateApprovalThresholds(thresholds);

    expect(result).not.toBeNull();
    expect(result?.rowErrors[0]).toBeUndefined();
    expect(result?.rowErrors[1]?.thresholdAmount).toBeDefined();
    expect(result?.rowErrors[2]?.thresholdAmount).toBeDefined();
  });
});
