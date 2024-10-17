import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { Activity } from '@121-service/src/activities/types/activity.type';

export class ActivitiesDto {
  meta: {
    availableTypes: ActivityTypeEnum[];
    count: Partial<Record<ActivityTypeEnum, number>>;
  };
  data: Activity[];
}
