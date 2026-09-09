import { ActivityInfoTypeParametersDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-type-parameters.dto';

/**
 * A single element of an ActivityInfo form schema. Elements include data
 * fields as well as layout-only items such as sections and notes.
 */
export interface ActivityInfoFormFieldDto {
  /** Immutable CUID, unique within the form */
  id: string;
  /** Developer-friendly identifier, matching ^[A-Za-z][A-Za-z0-9_]* */
  code?: string;
  /** Human-readable field name */
  label: string;
  description?: string;
  /** Field type identifier, see ActivityInfoFieldType */
  type: string;
  required?: boolean;
  key?: boolean;
  readOnly?: boolean;
  typeParameters?: ActivityInfoTypeParametersDto;
}
