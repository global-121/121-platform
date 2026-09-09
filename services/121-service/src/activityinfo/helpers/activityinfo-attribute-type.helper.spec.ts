import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import {
  getActivityInfoTypesFor121Type,
  resolveAttributeTypeForActivityInfoField,
} from '@121-service/src/activityinfo/helpers/activityinfo-attribute-type.helper';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

describe('activityinfo-attribute-type.helper', () => {
  describe('resolveAttributeTypeForActivityInfoField', () => {
    it.each([
      [ActivityInfoFieldType.freeText, RegistrationAttributeTypes.text],
      [ActivityInfoFieldType.narrative, RegistrationAttributeTypes.text],
      [ActivityInfoFieldType.quantity, RegistrationAttributeTypes.numeric],
      [ActivityInfoFieldType.calculated, RegistrationAttributeTypes.text],
      [ActivityInfoFieldType.serial, RegistrationAttributeTypes.text],
      [ActivityInfoFieldType.geoPoint, RegistrationAttributeTypes.text],
      [ActivityInfoFieldType.month, RegistrationAttributeTypes.text],
      [ActivityInfoFieldType.epiWeek, RegistrationAttributeTypes.text],
      [ActivityInfoFieldType.fortnight, RegistrationAttributeTypes.text],
    ])('maps %s to %s', (activityInfoType, expectedAttributeType) => {
      const attributeType = resolveAttributeTypeForActivityInfoField({
        field: { type: activityInfoType },
      });

      expect(attributeType).toBe(expectedAttributeType);
    });

    it('maps a date to text, because ActivityInfo serializes ISO dates', () => {
      const attributeType = resolveAttributeTypeForActivityInfoField({
        field: { type: ActivityInfoFieldType.date },
      });

      expect(attributeType).toBe(RegistrationAttributeTypes.text);
    });

    it('maps a single-cardinality enumerated field to a dropdown', () => {
      const attributeType = resolveAttributeTypeForActivityInfoField({
        field: {
          type: ActivityInfoFieldType.enumerated,
          cardinality: ActivityInfoEnumeratedCardinality.single,
        },
      });

      expect(attributeType).toBe(RegistrationAttributeTypes.dropdown);
    });

    it('maps a multiple-cardinality enumerated field to text, because the input validator rejects multi-select', () => {
      const attributeType = resolveAttributeTypeForActivityInfoField({
        field: {
          type: ActivityInfoFieldType.enumerated,
          cardinality: ActivityInfoEnumeratedCardinality.multiple,
        },
      });

      expect(attributeType).toBe(RegistrationAttributeTypes.text);
    });

    it('defaults an enumerated field without cardinality to a dropdown', () => {
      const attributeType = resolveAttributeTypeForActivityInfoField({
        field: { type: ActivityInfoFieldType.enumerated },
      });

      expect(attributeType).toBe(RegistrationAttributeTypes.dropdown);
    });

    it.each([
      ActivityInfoFieldType.attachment,
      ActivityInfoFieldType.reference,
      ActivityInfoFieldType.multipleSelectReference,
      ActivityInfoFieldType.reverseReference,
      ActivityInfoFieldType.section,
      ActivityInfoFieldType.note,
      ActivityInfoFieldType.subForm,
    ])('returns undefined for the unsupported type %s', (activityInfoType) => {
      const attributeType = resolveAttributeTypeForActivityInfoField({
        field: { type: activityInfoType },
      });

      expect(attributeType).toBeUndefined();
    });
  });

  describe('getActivityInfoTypesFor121Type', () => {
    it('describes a dropdown as a single-cardinality enumerated field', () => {
      const types = getActivityInfoTypesFor121Type({
        attributeType: RegistrationAttributeTypes.dropdown,
      });

      expect(types).toEqual(['enumerated (single)']);
    });

    it('lists every ActivityInfo type that maps to numeric', () => {
      const types = getActivityInfoTypesFor121Type({
        attributeType: RegistrationAttributeTypes.numeric,
      });

      expect(types).toEqual([ActivityInfoFieldType.quantity]);
    });

    it('lists the text types, including date', () => {
      const types = getActivityInfoTypesFor121Type({
        attributeType: RegistrationAttributeTypes.text,
      });

      expect(types).toContain(ActivityInfoFieldType.freeText);
      expect(types).toContain(ActivityInfoFieldType.narrative);
      expect(types).toContain(ActivityInfoFieldType.date);
    });

    it('returns an empty list for a type no ActivityInfo field maps to', () => {
      const types = getActivityInfoTypesFor121Type({
        attributeType: RegistrationAttributeTypes.boolean,
      });

      expect(types).toEqual([]);
    });
  });
});
