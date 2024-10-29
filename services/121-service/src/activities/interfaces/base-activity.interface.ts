import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';

export interface BaseActivity {
  id: string;
  user: {
    id?: number;
    username?: string;
  };
  created: Date;
  type: ActivityTypeEnum;
  attributes: Record<string, unknown>;
}
