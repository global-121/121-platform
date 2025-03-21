import { RegistrationsInputValidatorHelpers } from '@121-service/src/registration/validators/registrations-input.validator.helper';

describe('RegistrationsInputValidatorHelpers', () => {
  describe('inputToBoolean', () => {
    it.concurrent.each([['true'], ['yes'], ['1'], [1], [true]])(
      'should return true for input "%s"',
      async (input) => {
        expect(RegistrationsInputValidatorHelpers.inputToBoolean(input)).toBe(
          true,
        );
      },
    );

    it.concurrent.each([
      ['false'],
      ['no'],
      ['0'],
      [''],
      [0],
      [2],
      ['unrecognized'],
      [false],
    ])('should return false for input "%s"', async (input) => {
      expect(RegistrationsInputValidatorHelpers.inputToBoolean(input)).toBe(
        false,
      );
    });

    it.concurrent.each([[null], [undefined]])(
      'should return undefined for input %s',
      async (input) => {
        expect(
          RegistrationsInputValidatorHelpers.inputToBoolean(input),
        ).toBeUndefined();
      },
    );
  });
});
