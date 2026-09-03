import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';

export interface ActivityInfoFormDefinition {
  formId: string;
  name: string;
  fields: ActivityInfoFieldCleaned[];
  // An ActivityInfo form declares at most one language, unlike a Kobo form
  // which carries a label per language. Undefined when the form does not
  // declare one, in which case English is assumed.
  language?: string;
  schemaVersion: string;
}
