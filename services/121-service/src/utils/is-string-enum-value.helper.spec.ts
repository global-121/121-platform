import { isStringEnumValue } from '@121-service/src/utils/is-string-enum-value.helper';

enum MockStatusEnum {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

describe('isStringEnumValue', () => {
  it.each([
    [MockStatusEnum.Pending],
    [MockStatusEnum.Approved],
    [MockStatusEnum.Rejected],
  ])('returns true for a valid enum value: %s', (value) => {
    expect(isStringEnumValue(MockStatusEnum, value)).toBe(true);
  });

  it.each(['pending ', 'PENDING', 'unknown', '', '0'])(
    'returns false for an invalid enum value: %s',
    (value) => {
      expect(isStringEnumValue(MockStatusEnum, value)).toBe(false);
    },
  );

  it('returns false when the value is undefined', () => {
    expect(isStringEnumValue(MockStatusEnum, undefined)).toBe(false);
  });

  it('returns false for an empty enum-like object', () => {
    const EmptyEnum = {};

    expect(isStringEnumValue(EmptyEnum, 'anything')).toBe(false);
  });

  it('works with an enum-like object declared with as const', () => {
    const Direction = {
      Up: 'up',
      Down: 'down',
      Left: 'left',
      Right: 'right',
    } as const;

    expect(isStringEnumValue(Direction, Direction.Up)).toBe(true);
    expect(isStringEnumValue(Direction, Direction.Right)).toBe(true);
    expect(isStringEnumValue(Direction, 'diagonal')).toBe(false);
  });

  it('matches enum values exactly', () => {
    expect(isStringEnumValue(MockStatusEnum, 'approved')).toBe(true);
    expect(isStringEnumValue(MockStatusEnum, 'Approved')).toBe(false);
  });

  it('supports duplicate enum values', () => {
    const Result = {
      Success: 'ok',
      Complete: 'ok',
      Failure: 'error',
    } as const;

    expect(isStringEnumValue(Result, 'ok')).toBe(true);
    expect(isStringEnumValue(Result, 'error')).toBe(true);
  });
});
