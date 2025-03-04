import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';

export interface IgnoredDuplication extends BaseActivity {
  type: ActivityTypeEnum.IgnoredDuplication;
  attributes: {
    duplicateRegistrationId: string;
    duplicateRegistrationProgramId: string;
    reason: string | null; // Reason for the status change
  };
}
