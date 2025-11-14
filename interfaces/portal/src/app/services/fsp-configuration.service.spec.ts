import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { sensitivePropertyString } from '@121-service/src/program-fsp-configurations/const/sensitive-property-string.const';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

import { FspConfiguration } from '~/domains/fsp-configuration/fsp-configuration.model';
import { AttributeWithTranslatedLabel } from '~/domains/program/program.model';
import { FspConfigurationService } from '~/services/fsp-configuration.service';

const createStubExistingConfiguration = (
  partial: Partial<FspConfiguration> = {},
): FspConfiguration => ({
  programId: 1,
  fspName: Fsps.intersolveVisa,
  name: 'Some internal name',
  label: { en: 'Existing Label' },
  properties: [
    {
      name: FspConfigurationProperties.brandCode,
      updated: new Date().toISOString(),
      value: 'BRAND-123',
    },
    {
      name: FspConfigurationProperties.coverLetterCode,
      updated: new Date().toISOString(),
      value: 'COVER-999',
    },
  ],
  ...partial,
});

const createProgramAttribute = (
  name: string,
): AttributeWithTranslatedLabel => ({
  name,
  label: 'label',
  type: RegistrationAttributeTypes.text,
});

describe('FspConfigurationService', () => {
  let service: FspConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FspConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMissingRequiredAttributes', () => {
    it('should return missing required attributes when program lacks them', () => {
      const fspSetting = FSP_SETTINGS[Fsps.intersolveVisa];
      const programAttributes = [
        createProgramAttribute(FspAttributes.fullName),
      ];

      const missing = service.getMissingRequiredAttributes({
        fspSetting,
        programAttributes,
      });
      // Intersolve Visa required attributes except fullName
      expect(missing.map((a) => a.name)).toEqual([
        FspAttributes.addressCity,
        FspAttributes.addressHouseNumber,
        FspAttributes.addressPostalCode,
        FspAttributes.addressStreet,
        FspAttributes.phoneNumber,
      ]);
    });

    it('should return empty array when program has all required attributes', () => {
      const fspSetting = FSP_SETTINGS[Fsps.intersolveVisa];
      const programAttributes = [
        createProgramAttribute(FspAttributes.fullName),
        createProgramAttribute(FspAttributes.addressCity),
        createProgramAttribute(FspAttributes.addressHouseNumber),
        createProgramAttribute(FspAttributes.addressPostalCode),
        createProgramAttribute(FspAttributes.addressStreet),
        createProgramAttribute(FspAttributes.phoneNumber),
      ];

      const missing = service.getMissingRequiredAttributes({
        fspSetting,
        programAttributes,
      });
      expect(missing).toEqual([]);
    });
  });

  describe('fspSettingToFormGroup', () => {
    it('should create a form group with default displayName and configuration controls (Visa)', () => {
      const fspSetting = FSP_SETTINGS[Fsps.intersolveVisa];
      const formGroup = service.fspSettingToFormGroup({ fspSetting });

      expect(formGroup instanceof FormGroup).toBeTrue();
      expect(formGroup.get('displayName')?.value).toBe(
        fspSetting.defaultLabel.en,
      );
      // Required validators
      expect(
        formGroup.get(FspConfigurationProperties.brandCode)?.validator,
      ).toBeTruthy();
      expect(
        formGroup.get(FspConfigurationProperties.coverLetterCode)?.validator,
      ).toBeTruthy(); // coverLetterCode is required per FSP_SETTINGS for Visa
      expect(
        formGroup.get(FspConfigurationProperties.fundingTokenCode)?.validator,
      ).toBeTruthy(); // fundingTokenCode required
    });

    it('should use existing configuration label and property values when provided (Visa)', () => {
      const fspSetting = FSP_SETTINGS[Fsps.intersolveVisa];
      const existing = createStubExistingConfiguration({
        label: { en: 'Existing Visa Label' },
        properties: [
          {
            name: FspConfigurationProperties.brandCode,
            value: 'BRAND-X',
            updated: new Date().toISOString(),
          },
          {
            name: FspConfigurationProperties.coverLetterCode,
            value: 'COVER-Y',
            updated: new Date().toISOString(),
          },
        ],
      });
      const formGroup = service.fspSettingToFormGroup({
        fspSetting,
        existingFspConfiguration: existing,
      });
      expect(formGroup.get('displayName')?.value).toBe('Existing Visa Label');
      expect(formGroup.get(FspConfigurationProperties.brandCode)?.value).toBe(
        'BRAND-X',
      );
      expect(
        formGroup.get(FspConfigurationProperties.coverLetterCode)?.value,
      ).toBe('COVER-Y');
    });

    it('should replace sensitive password property value with empty string forcing re-entry (Commercial Bank of Ethiopia)', () => {
      const fspSetting = FSP_SETTINGS[Fsps.commercialBankEthiopia];
      const existing = createStubExistingConfiguration({
        fspName: Fsps.commercialBankEthiopia,
        properties: [
          {
            name: FspConfigurationProperties.password,
            value: sensitivePropertyString,
            updated: new Date().toISOString(),
          },
        ],
      });
      const formGroup = service.fspSettingToFormGroup({
        fspSetting,
        existingFspConfiguration: existing,
      });
      expect(formGroup.get(FspConfigurationProperties.password)?.value).toBe(
        '',
      );
    });

    it('should default multi-select property to empty array when no existing value', () => {
      const fspSetting = FSP_SETTINGS[Fsps.excel];
      const formGroup = service.fspSettingToFormGroup({ fspSetting });
      expect(
        formGroup.get(FspConfigurationProperties.columnsToExport)?.value,
      ).toEqual([]);
    });

    it('should default multi-select property to array when existing value', () => {
      const fspSetting = FSP_SETTINGS[Fsps.excel];
      const existing = createStubExistingConfiguration({
        fspName: Fsps.excel,
        properties: [
          {
            name: FspConfigurationProperties.columnsToExport,
            value: ['COLUMN_A', 'COLUMN_B'],
            updated: new Date().toISOString(),
          },
        ],
      });
      const formGroup = service.fspSettingToFormGroup({
        fspSetting,
        existingFspConfiguration: existing,
      });
      expect(
        formGroup.get(FspConfigurationProperties.columnsToExport)?.value,
      ).toEqual(['COLUMN_A', 'COLUMN_B']);
    });
  });

  describe('fspSettingToFspFormFields', () => {
    it('should build field metadata including sensitivity flag (Commercial Bank of Ethiopia)', () => {
      const fspSetting = FSP_SETTINGS[Fsps.commercialBankEthiopia];
      const existing = createStubExistingConfiguration({
        fspName: Fsps.commercialBankEthiopia,
        properties: [
          {
            name: FspConfigurationProperties.password,
            value: sensitivePropertyString,
            updated: new Date().toISOString(),
          },
          {
            name: FspConfigurationProperties.username,
            value: 'admin-user',
            updated: new Date().toISOString(),
          },
        ],
      });

      const fields = service.fspSettingToFspFormFields({
        fspSetting,
        existingFspConfiguration: existing,
      });

      // First field is always displayName
      expect(fields[0]).toEqual({
        name: 'displayName',
        isRequired: true,
        isSensitive: false,
      });
      const passwordField = fields.find(
        (f) => f.name === FspConfigurationProperties.password,
      );
      const usernameField = fields.find(
        (f) => f.name === FspConfigurationProperties.username,
      );
      expect(passwordField?.isSensitive).toBeTrue();
      expect(usernameField?.isSensitive).toBeFalse();
    });
  });

  describe('getPropertyFieldType', () => {
    it('should return select-attribute for columnToMatch', () => {
      expect(
        service.getPropertyFieldType(FspConfigurationProperties.columnToMatch),
      ).toBe('select-attribute');
    });
    it('should return select-attributes-multiple for columnsToExport', () => {
      expect(
        service.getPropertyFieldType(
          FspConfigurationProperties.columnsToExport,
        ),
      ).toBe('select-attributes-multiple');
    });
    it('should default to string for other properties', () => {
      expect(
        service.getPropertyFieldType(FspConfigurationProperties.brandCode),
      ).toBe('string');
    });
  });

  describe('getRequiredFspAttributes (non-Excel)', () => {
    it('should return required attribute names for a non-Excel FSP', () => {
      const fspSetting = FSP_SETTINGS[Fsps.intersolveVisa];
      const existing = createStubExistingConfiguration();
      const result = service.getRequiredFspAttributes({
        fspSetting,
        existingFspConfiguration: existing,
      });
      expect(result).toEqual([
        FspAttributes.fullName,
        FspAttributes.addressCity,
        FspAttributes.addressHouseNumber,
        FspAttributes.addressPostalCode,
        FspAttributes.addressStreet,
        FspAttributes.phoneNumber,
      ]);
    });
  });

  describe('getRequiredFspAttributes (Excel)', () => {
    // For Excel FSP the required attributes are dynamic based on two configuration properties:
    // columnsToExport (array|string) and columnToMatch (string). They are merged and deduplicated.
    const fspSetting = FSP_SETTINGS[Fsps.excel];

    it('should merge and deduplicate attributes from both properties (array + string)', () => {
      const existing = createStubExistingConfiguration({
        fspName: Fsps.excel,
        properties: [
          {
            name: FspConfigurationProperties.columnsToExport,
            value: ['fullName', 'addressCity', 'phoneNumber'],
            updated: new Date().toISOString(),
          },
          {
            name: FspConfigurationProperties.columnToMatch,
            value: 'phoneNumber',
            updated: new Date().toISOString(),
          },
        ],
      });

      const result = service.getRequiredFspAttributes({
        fspSetting,
        existingFspConfiguration: existing,
      });

      // Expect unique combined list
      expect(result).toEqual(['fullName', 'addressCity', 'phoneNumber']);
    });

    it('should handle when columnsToExport is empty', () => {
      const existing = createStubExistingConfiguration({
        fspName: Fsps.excel,
        properties: [
          {
            name: FspConfigurationProperties.columnsToExport,
            value: [],
            updated: new Date().toISOString(),
          },
          {
            name: FspConfigurationProperties.columnToMatch,
            value: 'fullName',
            updated: new Date().toISOString(),
          },
        ],
      });
      const result = service.getRequiredFspAttributes({
        fspSetting,
        existingFspConfiguration: existing,
      });
      expect(result).toEqual(['fullName']);
    });
  });
});
