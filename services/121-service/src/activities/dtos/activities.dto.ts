import { ApiProperty } from '@nestjs/swagger';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { Activity } from '@121-service/src/activities/types/activity.type';

const activityTypesStrings = Object.values(ActivityTypeEnum);
class ActivitiesMetaObject {
  @ApiProperty({
    type: [String],
    enum: activityTypesStrings,
    description: 'The available activity types. Can be 0 or more.',
  })
  availableTypes: ActivityTypeEnum[];
  @ApiProperty({
    type: Object,
    example: {
      [ActivityTypeEnum.Note]: 1,
      [ActivityTypeEnum.Transaction]: 2,
      [ActivityTypeEnum.Message]: 1,
    },
    description: 'The count of the available activity types.',
  })
  count: Partial<Record<ActivityTypeEnum, number>>;
}

export class ActivitiesDto {
  @ApiProperty()
  meta: ActivitiesMetaObject;
  @ApiProperty({
    type: [Object],
    description: 'The data of the activities.',
  })
  data: Activity[];
}
