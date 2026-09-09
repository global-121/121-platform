import {
  ActivityInfoEnumeratedCardinality,
  ActivityInfoFieldType,
} from '@121-service/src/activityinfo/enum/activityinfo-field-type';
import { ActivityInfoChoiceCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-choice-cleaned.interface';

export interface ActivityInfoFieldCleaned {
  // The immutable ActivityInfo field id (CUID). This is the stable key 121
  // stores its mapping against, so renaming a code or label in ActivityInfo
  // does not break an existing integration.
  id: string;
  // The developer-friendly field code. Used as the 121 attribute name, because
  // 121 matches Fsp attributes, the fullname naming convention and reserved
  // attributes by name. Absent when the form author did not set one.
  code?: string;
  // The human-friendly field label, shown in the Portal.
  label: string;
  type: ActivityInfoFieldType;
  cardinality?: ActivityInfoEnumeratedCardinality;
  choices: ActivityInfoChoiceCleaned[];
}
