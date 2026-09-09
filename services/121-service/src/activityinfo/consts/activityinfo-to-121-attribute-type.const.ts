import { ActivityInfoFieldType } from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

const { numeric, text } = RegistrationAttributeTypes;

/**
 * Maps ActivityInfo field types to 121 registration attribute types.
 *
 * Types absent from this mapping do not become registration attributes:
 * - 'section', 'note' carry no data.
 * - 'attachment', 'reference', 'multiselectreference', 'reversereference' are
 *   excluded from the ActivityInfo record query response, so they would always
 *   import as empty.
 * - 'subform' is rejected during validation.
 *
 * 'enumerated' is absent on purpose: it maps to either a dropdown or a
 * multi-select depending on its cardinality, which is resolved by
 * `resolveAttributeTypeForActivityInfoField`.
 */
export const ACTIVITY_INFO_TO_121_TYPE_MAPPING: Partial<
  Record<ActivityInfoFieldType, RegistrationAttributeTypes>
> = {
  [ActivityInfoFieldType.calculated]: text,
  // ActivityInfo serializes dates as ISO-8601 ('YYYY-MM-DD'), while the 121
  // 'date' attribute type expects 'DD-MM-YYYY'. Importing them as text avoids
  // failing validation on every record.
  [ActivityInfoFieldType.date]: text,
  [ActivityInfoFieldType.epiWeek]: text,
  [ActivityInfoFieldType.fortnight]: text,
  [ActivityInfoFieldType.freeText]: text,
  [ActivityInfoFieldType.geoPoint]: text,
  [ActivityInfoFieldType.month]: text,
  [ActivityInfoFieldType.narrative]: text,
  [ActivityInfoFieldType.quantity]: numeric,
  [ActivityInfoFieldType.serial]: text,
};
