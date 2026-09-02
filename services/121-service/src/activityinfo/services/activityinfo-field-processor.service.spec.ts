import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { ActivityInfoFieldProcessorService } from '@121-service/src/activityinfo/services/activityinfo-field-processor.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('ActivityInfoFieldProcessorService', () => {
  const service = new ActivityInfoFieldProcessorService();
  const languageIsoCode = RegistrationPreferredLanguage.en;

  const createField = (
    overrides: Partial<ActivityInfoFieldCleaned> = {},
  ): ActivityInfoFieldCleaned => ({
    id: 'cfieldid000000001',
    code: 'householdSize',
    label: 'Household size',
    type: ActivityInfoFieldType.quantity,
    choices: [],
    ...overrides,
  });

  describe('fieldsToProgramRegistrationAttributes', () => {
    it('names the attribute after the field code', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [createField()],
        languageIsoCode,
      });

      expect(attribute.name).toBe('householdSize');
    });

    it('stores the immutable field id as the mapping key', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [createField({ id: 'cimmutableid00001' })],
        languageIsoCode,
      });

      expect(attribute.activityInfoFieldId).toBe('cimmutableid00001');
    });

    it('stores the field label for display', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [createField({ label: 'Household size' })],
        languageIsoCode,
      });

      expect(attribute.activityInfoLabel).toEqual({ en: 'Household size' });
    });

    it('falls back to the code when the field has no label', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [createField({ label: '' })],
        languageIsoCode,
      });

      expect(attribute.activityInfoLabel).toEqual({ en: 'householdSize' });
    });

    it('maps the resolved attribute type', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [createField({ type: ActivityInfoFieldType.quantity })],
        languageIsoCode,
      });

      expect(attribute.type).toBe(RegistrationAttributeTypes.numeric);
    });

    it('skips a field with an unsupported type', () => {
      const attributes = service.fieldsToProgramRegistrationAttributes({
        fields: [createField({ type: ActivityInfoFieldType.section })],
        languageIsoCode,
      });

      expect(attributes).toEqual([]);
    });

    it('skips a field without a code', () => {
      const attributes = service.fieldsToProgramRegistrationAttributes({
        fields: [createField({ code: undefined })],
        languageIsoCode,
      });

      expect(attributes).toEqual([]);
    });

    it('does not carry over the ActivityInfo required flag', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [createField()],
        languageIsoCode,
      });

      expect(attribute.isRequired).toBe(false);
    });

    it('maps choices to options, preferring the choice code', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [
          createField({
            type: ActivityInfoFieldType.enumerated,
            cardinality: ActivityInfoEnumeratedCardinality.single,
            choices: [
              { id: 'cchoice1', label: 'Yes', code: 'yes' },
              { id: 'cchoice2', label: 'No' },
            ],
          }),
        ],
        languageIsoCode,
      });

      expect(attribute.options).toEqual([
        { option: 'yes', label: { en: 'Yes' } },
        { option: 'No', label: { en: 'No' } },
      ]);
    });

    it('maps several fields at once', () => {
      const attributes = service.fieldsToProgramRegistrationAttributes({
        fields: [
          createField({ id: 'cfield1', code: 'firstField' }),
          createField({ id: 'cfield2', code: 'secondField' }),
        ],
        languageIsoCode,
      });

      expect(attributes.map((attribute) => attribute.name)).toEqual([
        'firstField',
        'secondField',
      ]);
    });

    it('stores labels under the given language', () => {
      const [attribute] = service.fieldsToProgramRegistrationAttributes({
        fields: [createField()],
        languageIsoCode: RegistrationPreferredLanguage.nl,
      });

      expect(attribute.activityInfoLabel).toEqual({ nl: 'Household size' });
    });
  });
});
