import { ActivityInfoEnumItemDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-enum-item.dto';

/**
 * Type-specific configuration of a form field. ActivityInfo nests these under
 * the field's 'typeParameters' key rather than inlining them on the field.
 */
export interface ActivityInfoTypeParametersDto {
  /** For 'enumerated' fields: 'single' or 'multiple' (serialized lowercase) */
  cardinality?: string;
  /** For 'enumerated' fields: 'automatic', 'radio_button' or 'dropdown' */
  presentation?: string;
  /** For 'enumerated' fields: the selectable values */
  values?: ActivityInfoEnumItemDto[];
}
