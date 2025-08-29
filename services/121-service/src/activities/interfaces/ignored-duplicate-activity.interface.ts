import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';

export interface IgnoredDuplicateActivity extends BaseActivity {
  type: ActivityTypeEnum.IgnoredDuplicate;
  attributes: {
    duplicateWithRegistrationId: number;
    duplicateWithRegistrationProjectId: number;
    reason: string | null;
  };
}
