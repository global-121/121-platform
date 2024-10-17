import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';

export interface NoteActivity extends BaseActivity {
  type: ActivityTypeEnum.Note;
  attributes: {
    text: string; // The note content
  };
}
