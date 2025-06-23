import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';

export interface FspChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.FspChange;
  attributes: {
    oldValue: string | null;
    newValue: string | null;
    reason: string | null; // Reason for the data change
  };
}
