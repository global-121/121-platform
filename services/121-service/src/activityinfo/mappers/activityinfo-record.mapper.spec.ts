import { ActivityInfoRecordDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-record.dto';
import {
  ActivityInfoFieldMapping,
  ActivityInfoRecordMapper,
  getOptionValueForChoice,
} from '@121-service/src/activityinfo/mappers/activityinfo-record.mapper';

describe('ActivityInfoRecordMapper', () => {
  const phoneNumberFieldId = 'cphonefieldid0001';
  const fspFieldId = 'cfspfieldid000001';

  const createFieldMappings = (
    entries: [string, ActivityInfoFieldMapping][] = [
      [phoneNumberFieldId, { attributeName: 'phoneNumber', choices: [] }],
    ],
  ): Map<string, ActivityInfoFieldMapping> => new Map(entries);

  const createRecord = (
    overrides: ActivityInfoRecordDto = {},
  ): ActivityInfoRecordDto => ({
    _id: 'c4dl5f8lh1x8ybdl',
    [phoneNumberFieldId]: '31600000000',
    ...overrides,
  });

  describe('mapRecordToRegistrationData', () => {
    it('uses the record id as the referenceId', () => {
      const registrationData =
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: createRecord(),
          fieldMappingsByFieldId: createFieldMappings(),
        });

      expect(registrationData.referenceId).toBe('c4dl5f8lh1x8ybdl');
    });

    it('maps a value from its field id to the attribute name', () => {
      const registrationData =
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: createRecord(),
          fieldMappingsByFieldId: createFieldMappings(),
        });

      expect(registrationData.phoneNumber).toBe('31600000000');
    });

    it('throws when the record has no record id column', () => {
      expect(() =>
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: { [phoneNumberFieldId]: '31600000000' },
          fieldMappingsByFieldId: createFieldMappings(),
        }),
      ).toThrow("missing its '_id' column");
    });

    it('throws when the record id is not a string', () => {
      expect(() =>
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: createRecord({ _id: 42 }),
          fieldMappingsByFieldId: createFieldMappings(),
        }),
      ).toThrow("missing its '_id' column");
    });

    it('throws when the record id is an empty string', () => {
      expect(() =>
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: createRecord({ _id: '' }),
          fieldMappingsByFieldId: createFieldMappings(),
        }),
      ).toThrow("missing its '_id' column");
    });

    it.each([
      ['null', null],
      ['an empty string', ''],
    ])('omits an attribute whose value is %s', (_description, rawValue) => {
      const registrationData =
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: createRecord({ [phoneNumberFieldId]: rawValue }),
          fieldMappingsByFieldId: createFieldMappings(),
        });

      expect(registrationData).not.toHaveProperty('phoneNumber');
    });

    it('omits an attribute whose column is absent from the record', () => {
      const registrationData =
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: { _id: 'c4dl5f8lh1x8ybdl' },
          fieldMappingsByFieldId: createFieldMappings(),
        });

      expect(registrationData).not.toHaveProperty('phoneNumber');
    });

    it('keeps a numeric value as a number', () => {
      const registrationData =
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: createRecord({ [phoneNumberFieldId]: 42 }),
          fieldMappingsByFieldId: createFieldMappings(),
        });

      expect(registrationData.phoneNumber).toBe(42);
    });

    it('ignores columns that have no field mapping', () => {
      const registrationData =
        ActivityInfoRecordMapper.mapRecordToRegistrationData({
          record: createRecord({ cunmappedfield01: 'ignored' }),
          fieldMappingsByFieldId: createFieldMappings(),
        });

      expect(registrationData).not.toHaveProperty('cunmappedfield01');
    });

    describe('choice normalization', () => {
      const fspMapping: ActivityInfoFieldMapping = {
        attributeName: 'programFspConfigurationName',
        choices: [
          { id: 'cchoice1', label: 'Visa debit card', code: 'VisaDebitCard' },
          { id: 'cchoice2', label: 'Cash' },
        ],
      };

      it('translates the label returned by the query API to the option value', () => {
        const registrationData =
          ActivityInfoRecordMapper.mapRecordToRegistrationData({
            record: createRecord({ [fspFieldId]: 'Visa debit card' }),
            fieldMappingsByFieldId: createFieldMappings([
              [fspFieldId, fspMapping],
            ]),
          });

        expect(registrationData.programFspConfigurationName).toBe(
          'VisaDebitCard',
        );
      });

      it('keeps the label as the option value for a choice without a code', () => {
        const registrationData =
          ActivityInfoRecordMapper.mapRecordToRegistrationData({
            record: createRecord({ [fspFieldId]: 'Cash' }),
            fieldMappingsByFieldId: createFieldMappings([
              [fspFieldId, fspMapping],
            ]),
          });

        expect(registrationData.programFspConfigurationName).toBe('Cash');
      });

      it('passes through a choice id, which the query API does not return', () => {
        const registrationData =
          ActivityInfoRecordMapper.mapRecordToRegistrationData({
            record: createRecord({ [fspFieldId]: 'cchoice1' }),
            fieldMappingsByFieldId: createFieldMappings([
              [fspFieldId, fspMapping],
            ]),
          });

        expect(registrationData.programFspConfigurationName).toBe('cchoice1');
      });

      it('passes through a value that matches no choice', () => {
        const registrationData =
          ActivityInfoRecordMapper.mapRecordToRegistrationData({
            record: createRecord({ [fspFieldId]: 'Unknown' }),
            fieldMappingsByFieldId: createFieldMappings([
              [fspFieldId, fspMapping],
            ]),
          });

        expect(registrationData.programFspConfigurationName).toBe('Unknown');
      });

      it('passes through a non-string value on a field with choices', () => {
        const registrationData =
          ActivityInfoRecordMapper.mapRecordToRegistrationData({
            record: createRecord({ [fspFieldId]: 7 }),
            fieldMappingsByFieldId: createFieldMappings([
              [fspFieldId, fspMapping],
            ]),
          });

        expect(registrationData.programFspConfigurationName).toBe(7);
      });
    });
  });

  describe('getOptionValueForChoice', () => {
    it('prefers the code', () => {
      const optionValue = getOptionValueForChoice({
        choice: { id: 'cchoice1', label: 'Visa debit card', code: 'VisaDebitCard' },
      });

      expect(optionValue).toBe('VisaDebitCard');
    });

    it('falls back to the label when there is no code', () => {
      const optionValue = getOptionValueForChoice({
        choice: { id: 'cchoice2', label: 'Cash' },
      });

      expect(optionValue).toBe('Cash');
    });
  });
});
