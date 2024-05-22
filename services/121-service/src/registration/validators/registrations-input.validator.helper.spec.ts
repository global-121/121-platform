import { RegistrationsInputValidatorHelpers } from '@121-service/src/registration/validators/registrations-input.validator.helper';

describe('RegistrationsInputValidatorHelpers', () => {
  describe('stringToBoolean', () => {
    it('should convert "true", "yes", and "1" to true', () => {
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('true')).toBe(
        true,
      );
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('yes')).toBe(
        true,
      );
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('1')).toBe(
        true,
      );
    });

    it('should convert "false", "no", "0", "", and null to false', () => {
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('false')).toBe(
        false,
      );
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('no')).toBe(
        false,
      );
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('0')).toBe(
        false,
      );
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('')).toBe(
        false,
      );
      expect(RegistrationsInputValidatorHelpers.stringToBoolean(null)).toBe(
        false,
      );
    });

    it('should return undefined for unrecognized strings if no default value is provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.stringToBoolean('unrecognized'),
      ).toBeUndefined();
    });

    it('should return the default value for unrecognized strings if provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.stringToBoolean(
          'unrecognized',
          true,
        ),
      ).toBe(true);
      expect(
        RegistrationsInputValidatorHelpers.stringToBoolean(
          'unrecognized',
          false,
        ),
      ).toBe(false);
    });

    it('should return the default value for undefined input if provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.stringToBoolean(undefined, true),
      ).toBe(true);
      expect(
        RegistrationsInputValidatorHelpers.stringToBoolean(undefined, false),
      ).toBe(false);
    });

    it('should return undefined for undefined input if no default value is provided', () => {
      expect(
        RegistrationsInputValidatorHelpers.stringToBoolean(undefined),
      ).toBeUndefined();
    });

    it('should handle boolean input by returning it directly', () => {
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('true')).toBe(
        true,
      );
      expect(RegistrationsInputValidatorHelpers.stringToBoolean('false')).toBe(
        false,
      );
    });
  });
});
