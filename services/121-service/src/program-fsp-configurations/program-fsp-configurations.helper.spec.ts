import { HttpException, HttpStatus } from '@nestjs/common';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ProgramFspConfigurationsHelperService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.helper';

const mockFspModes: Record<string, string> = {};

jest.mock(
  '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const',
  () => ({
    get FSP_MODES() {
      return mockFspModes;
    },
  }),
);

describe('ProgramFspConfigurationsHelperService', () => {
  let helper: ProgramFspConfigurationsHelperService;

  beforeEach(() => {
    helper = new ProgramFspConfigurationsHelperService();
  });

  describe('computeFspConfigurationState', () => {
    it('should return configured when FSP has no required properties', () => {
      // Intersolve Visa has no required configuration properties
      const result = helper.computeFspConfigurationState({
        fspName: Fsps.safaricom,
        fspConfigurationProperties: [],
      });

      expect(result).toBe(FspConfigurationStates.configured);
    });

    it('should return configured when all required properties are provided', () => {
      // Excel requires columnToMatch
      const result = helper.computeFspConfigurationState({
        fspName: Fsps.excel,
        fspConfigurationProperties: [
          {
            name: FspConfigurationProperties.columnToMatch,
            value: 'phoneNumber',
          },
        ],
      });

      expect(result).toBe(FspConfigurationStates.configured);
    });

    it('should return configurationPending when required properties are missing', () => {
      // Excel requires columnToMatch, providing nothing
      const result = helper.computeFspConfigurationState({
        fspName: Fsps.excel,
        fspConfigurationProperties: [],
      });

      expect(result).toBe(FspConfigurationStates.configurationPending);
    });

    it('should return configurationPending when only non-required properties are provided', () => {
      // Excel requires columnToMatch; columnsToExport is optional
      const result = helper.computeFspConfigurationState({
        fspName: Fsps.excel,
        fspConfigurationProperties: [
          {
            name: FspConfigurationProperties.columnsToExport,
            value: ['col1', 'col2'],
          },
        ],
      });

      expect(result).toBe(FspConfigurationStates.configurationPending);
    });
  });

  describe('validatePropertyValueTypeOrThrow', () => {
    it('should not throw when value matches expected string type', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.columnToMatch,
          propertyValue: 'phoneNumber',
        }),
      ).not.toThrow();
    });

    it('should not throw when value matches expected number type', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.maxBalanceInCents,
          propertyValue: 50000,
        }),
      ).not.toThrow();
    });

    it('should not throw when value matches expected boolean type', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.cardDistributionByMail,
          propertyValue: true,
        }),
      ).not.toThrow();
    });

    it('should not throw when value matches expected array type with string items', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.columnsToExport,
          propertyValue: ['col1', 'col2'],
        }),
      ).not.toThrow();
    });

    it('should throw when value is a string but expected number', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.maxBalanceInCents,
          propertyValue: 'not-a-number' as any,
        }),
      ).toThrow(HttpException);
    });

    it('should throw when value is NaN', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.maxBalanceInCents,
          propertyValue: NaN,
        }),
      ).toThrow(HttpException);
    });

    it('should throw when array contains non-string items', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.columnsToExport,
          propertyValue: [123, 456] as any,
        }),
      ).toThrow(HttpException);
    });

    it('should throw with BAD_REQUEST status', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.maxBalanceInCents,
          propertyValue: 'wrong' as any,
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }),
      );
    });
  });

  describe('validatePropertyValueTypesOrThrow', () => {
    it('should not throw when all properties have valid types', () => {
      expect(() =>
        helper.validatePropertyValueTypesOrThrow([
          {
            name: FspConfigurationProperties.columnToMatch,
            value: 'phoneNumber',
          },
          {
            name: FspConfigurationProperties.columnsToExport,
            value: ['col1'],
          },
        ]),
      ).not.toThrow();
    });

    it('should throw when any property has an invalid type', () => {
      expect(() =>
        helper.validatePropertyValueTypesOrThrow([
          {
            name: FspConfigurationProperties.columnToMatch,
            value: 'valid',
          },
          {
            name: FspConfigurationProperties.maxBalanceInCents,
            value: 'not-a-number' as any,
          },
        ]),
      ).toThrow(HttpException);
    });

    it('should not throw for empty array', () => {
      expect(() => helper.validatePropertyValueTypesOrThrow([])).not.toThrow();
    });
  });

  describe('validateLabelHasEnglishTranslation', () => {
    it('should not throw when label has en property', () => {
      expect(() =>
        helper.validateLabelHasEnglishTranslation({ en: 'English label' }),
      ).not.toThrow();
    });

    it('should throw when label is missing en property', () => {
      expect(() =>
        helper.validateLabelHasEnglishTranslation({ nl: 'Dutch label' }),
      ).toThrow(HttpException);
    });

    it('should throw when en is empty string', () => {
      expect(() =>
        helper.validateLabelHasEnglishTranslation({ en: '' }),
      ).toThrow(HttpException);
    });

    it('should throw with BAD_REQUEST status', () => {
      expect(() =>
        helper.validateLabelHasEnglishTranslation({ nl: 'Dutch' }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
        }),
      );
    });
  });

  describe('validateFspIsEnabledOrThrow', () => {
    beforeEach(() => {
      for (const key of Object.keys(mockFspModes)) {
        delete mockFspModes[key];
      }
    });

    it('should not throw when FSP is not disabled', () => {
      mockFspModes[Fsps.excel] = FspMode.mock;

      expect(() =>
        helper.validateFspIsEnabledOrThrow({ fspName: Fsps.excel }),
      ).not.toThrow();
    });

    it('should throw with BAD_REQUEST when FSP is disabled', () => {
      mockFspModes[Fsps.excel] = FspMode.disabled;

      expect(() =>
        helper.validateFspIsEnabledOrThrow({ fspName: Fsps.excel }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining(Fsps.excel),
        }),
      );
    });
  });

  describe('getAllowlistedPropertyNamesForFsp', () => {
    it('should return empty array for FSP with no configuration properties', () => {
      const result = helper.getAllowlistedPropertyNamesForFsp(Fsps.safaricom);

      expect(result).toEqual([]);
    });

    it('should only return properties marked as public', () => {
      const result = helper.getAllowlistedPropertyNamesForFsp(
        Fsps.intersolveVisa,
      );

      // cardDistributionByMail is the only public property for Intersolve Visa
      expect(result).toContain(
        FspConfigurationProperties.cardDistributionByMail,
      );

      // Secret properties should not be included
      expect(result).not.toContain(FspConfigurationProperties.password);
      expect(result).not.toContain(FspConfigurationProperties.username);
    });

    it('should return an array (not undefined or null)', () => {
      const result = helper.getAllowlistedPropertyNamesForFsp(Fsps.excel);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
