import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { BaseActivity } from '@121-service/src/activities/interfaces/base-activity.interface';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export interface StatusChangeActivity extends BaseActivity {
  type: ActivityTypeEnum.StatusChange;
  attributes: {
    oldValue: RegistrationStatusEnum;
    newValue: RegistrationStatusEnum;
  };
}
