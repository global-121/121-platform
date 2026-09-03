import { ACTIVITY_INFO_TO_121_TYPE_MAPPING } from '@121-service/src/activityinfo/consts/activityinfo-to-121-attribute-type.const';
import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

/**
 * Resolves the 121 registration attribute type for an ActivityInfo field.
 * Returns undefined for field types that do not become attributes.
 */
export const resolveAttributeTypeForActivityInfoField = ({
  field,
}: {
  field: Pick<ActivityInfoFieldCleaned, 'type' | 'cardinality'>;
}): RegistrationAttributeTypes | undefined => {
  if (field.type !== ActivityInfoFieldType.enumerated) {
    return ACTIVITY_INFO_TO_121_TYPE_MAPPING[field.type];
  }

  // A multi-cardinality select is imported as free text, because the 121
  // registration input validator has no branch for the 'multi-select' type and
  // would reject every value. This mirrors how Kobo maps 'select_multiple'.
  if (field.cardinality === ActivityInfoEnumeratedCardinality.multiple) {
    return RegistrationAttributeTypes.text;
  }

  return RegistrationAttributeTypes.dropdown;
};

/**
 * Lists the ActivityInfo field types that map to a given 121 attribute type.
 * Used to explain an accepted alternative when a field has the wrong type.
 */
export const getActivityInfoTypesFor121Type = ({
  attributeType,
}: {
  attributeType: RegistrationAttributeTypes;
}): string[] => {
  if (attributeType === RegistrationAttributeTypes.dropdown) {
    return [`${ActivityInfoFieldType.enumerated} (single)`];
  }

  return Object.entries(ACTIVITY_INFO_TO_121_TYPE_MAPPING)
    .filter(([_type, mappedAttributeType]) => mappedAttributeType === attributeType)
    .map(([type]) => type);
};
