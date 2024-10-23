import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';

export interface DataChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.DataChange;
  attributes: {
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    reason: string | null; // Reason for the data change
  };
}
