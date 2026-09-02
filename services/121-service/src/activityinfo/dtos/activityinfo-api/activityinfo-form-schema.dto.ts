import { ActivityInfoFormFieldDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-form-field.dto';

/**
 * Response of the ActivityInfo getFormSchema call.
 * See: https://www.activityinfo.org/support/docs/api/reference/getFormSchema.html
 */
export interface ActivityInfoFormSchemaDto {
  id: string;
  label: string;
  /** Monotonically increasing version, assigned by the ActivityInfo server */
  schemaVersion: number | string;
  databaseId?: string;
  /** Present when this form is a subform of another form */
  parentFormId?: string;
  /** ISO language code of the form's labels, when declared */
  language?: string;
  elements?: ActivityInfoFormFieldDto[];
}
