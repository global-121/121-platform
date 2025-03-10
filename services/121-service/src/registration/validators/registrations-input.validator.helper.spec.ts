import { RegistrationsInputValidatorHelpers } from '@121-service/src/registration/validators/registrations-input.validator.helper';

describe('RegistrationsInputValidatorHelpers', () => {
  describe('stringToBoolean', () => {
    it('should convert "true", "yes", and "1" to true', () => {
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('true')).toBe(
        true,
      );
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('yes')).toBe(
        true,
      );
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('1')).toBe(true);
    });

    it('should convert "false", "no", "0", "", and null to false', () => {
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('false')).toBe(
        false,
      );
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('no')).toBe(
        false,
      );
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('0')).toBe(
        false,
      );
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('')).toBe(false);
    });

    it('should return undefined if undefined or null is provided as input', () => {
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean(undefined),
      ).toBeUndefined();
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean(null),
      ).toBeUndefined();
    });

    it('should return false as value for unrecognized strings if provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean('unrecognized'),
      ).toBe(false);
    });

    it('should return undefined for undefined input if no default value is provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean(undefined),
      ).toBeUndefined();
    });

    it('should handle boolean input by returning it directly', () => {
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('true')).toBe(
        true,
      );
      expect(RegistrationsInputValidatorHelpers.inputToBoolean('false')).toBe(
        false,
      );
    });
  });
});
