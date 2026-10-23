import { HttpStatus } from '@nestjs/common';

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
      // Safaricom has no required configuration properties
      const result = helper.computeFspConfigurationState({
        fspName: Fsps.safaricom,
        fspConfigurationProperties: [],
        excelConfigurationExists: false,
      });

      expect(result).toBe(FspConfigurationStates.configured);
    });

    it('should leave Excel pending until its dedicated configuration is saved', () => {
      const result = helper.computeFspConfigurationState({
        fspName: Fsps.excel,
        fspConfigurationProperties: [],
        excelConfigurationExists: false,
      });

      expect(result).toBe(FspConfigurationStates.configurationPending);
    });

    it('should configure Excel when its details have been saved', () => {
      const result = helper.computeFspConfigurationState({
        fspName: Fsps.excel,
        fspConfigurationProperties: [],
        excelConfigurationExists: true,
      });

      expect(result).toBe(FspConfigurationStates.configured);
    });
  });

  describe('validatePropertyValueTypeOrThrow', () => {
    it('should not throw when value matches expected string type', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.username,
          propertyValue: 'username',
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

    it('should throw when value is a string but expected number', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.maxBalanceInCents,
          propertyValue: 'not-a-number' as any,
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining('Expected number, got string'),
        }),
      );
    });

    it('should throw when value is NaN', () => {
      expect(() =>
        helper.validatePropertyValueTypeOrThrow({
          propertyName: FspConfigurationProperties.maxBalanceInCents,
          propertyValue: NaN,
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining('Expected number, got NaN'),
        }),
      );
    });
  });

  describe('validatePropertyValueTypesOrThrow', () => {
    it('should not throw when all generic properties have valid types', () => {
      expect(() =>
        helper.validatePropertyValueTypesOrThrow({
          properties: [
            {
              name: FspConfigurationProperties.username,
              value: 'username',
            },
            {
              name: FspConfigurationProperties.brandCode,
              value: 'brand-code',
            },
          ],
        }),
      ).not.toThrow();
    });

    it('should throw when any property has an invalid type', () => {
      expect(() =>
        helper.validatePropertyValueTypesOrThrow({
          properties: [
            {
              name: FspConfigurationProperties.username,
              value: 'valid',
            },
            {
              name: FspConfigurationProperties.maxBalanceInCents,
              value: 'not-a-number' as any,
            },
          ],
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining('Expected number, got string'),
        }),
      );
    });

    it('should not throw for an empty property list', () => {
      expect(() =>
        helper.validatePropertyValueTypesOrThrow({ properties: [] }),
      ).not.toThrow();
    });
  });

  describe('validateLabelHasEnglishTranslation', () => {
    it('should not throw when label has en property', () => {
      expect(() =>
        helper.validateLabelHasEnglishTranslation({
          label: { en: 'English label' },
        }),
      ).not.toThrow();
    });

    it('should throw when label is missing en property', () => {
      expect(() =>
        helper.validateLabelHasEnglishTranslation({
          label: { nl: 'Dutch label' },
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining(
            'Label must have an English translation',
          ),
        }),
      );
    });

    it('should throw when en is empty string', () => {
      expect(() =>
        helper.validateLabelHasEnglishTranslation({ label: { en: '' } }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining(
            'Label must have an English translation',
          ),
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

  describe('validateAllowedPropertyNames', () => {
    it('should reject legacy Excel fields from the generic property bag', () => {
      expect(() =>
        helper.validateAllowedPropertyNames({
          fspName: Fsps.excel,
          propertyNames: ['columnToMatch' as FspConfigurationProperties],
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining('columnToMatch'),
        }),
      );
    });

    it('should not throw for an empty array of property names', () => {
      expect(() =>
        helper.validateAllowedPropertyNames({
          fspName: Fsps.excel,
          propertyNames: [],
        }),
      ).not.toThrow();
    });

    it('should throw when a property name is not allowed for the FSP', () => {
      expect(() =>
        helper.validateAllowedPropertyNames({
          fspName: Fsps.excel,
          propertyNames: [FspConfigurationProperties.password],
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining(FspConfigurationProperties.password),
        }),
      );
    });

    it('should throw when duplicate property names are provided', () => {
      expect(() =>
        helper.validateAllowedPropertyNames({
          fspName: Fsps.intersolveVisa,
          propertyNames: [
            FspConfigurationProperties.brandCode,
            FspConfigurationProperties.brandCode,
          ],
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining(
            'Duplicate property names are not allowed',
          ),
        }),
      );
    });

    it('should throw combining both invalid name and duplicate errors', () => {
      expect(() =>
        helper.validateAllowedPropertyNames({
          fspName: Fsps.intersolveVisa,
          propertyNames: [
            FspConfigurationProperties.brandCode,
            FspConfigurationProperties.brandCode,
            FspConfigurationProperties.password,
          ],
        }),
      ).toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          message: expect.stringContaining(
            'Duplicate property names are not allowed',
          ),
        }),
      );
    });
  });

  describe('getAllowlistedPropertyNamesForFsp', () => {
    it('should return empty array for FSP with no configuration properties', () => {
      const result = helper.getAllowlistedPropertyNamesForFsp({
        fspName: Fsps.safaricom,
      });

      expect(result).toEqual([]);
    });

    it('should only return properties marked as public', () => {
      const result = helper.getAllowlistedPropertyNamesForFsp({
        fspName: Fsps.intersolveVisa,
      });

      // cardDistributionByMail is the only public property for Intersolve Visa
      expect(result).toContain(
        FspConfigurationProperties.cardDistributionByMail,
      );

      // Secret properties should not be included
      expect(result).not.toContain(FspConfigurationProperties.password);
      expect(result).not.toContain(FspConfigurationProperties.username);
    });

    it('should return empty array for Excel as it has no public properties', () => {
      const result = helper.getAllowlistedPropertyNamesForFsp({
        fspName: Fsps.excel,
      });

      expect(result).toEqual([]);
    });
  });
});
