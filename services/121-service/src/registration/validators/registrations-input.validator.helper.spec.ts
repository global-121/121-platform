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
      expect(RegistrationsInputValidatorHelpers.inputToBoolean(null)).toBe(
        false,
      );
    });

    it('should return undefined for unrecognized strings if no default value is provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean('unrecognized'),
      ).toBeUndefined();
    });

    it('should return the default value for unrecognized strings if provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean('unrecognized', true),
      ).toBe(true);
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean(
          'unrecognized',
          false,
        ),
      ).toBe(false);
    });

    it('should return the default value for undefined input if provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean(undefined, true),
      ).toBe(true);
      expect(
        RegistrationsInputValidatorHelpers.inputToBoolean(undefined, false),
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
