import { Module } from '@nestjs/common';

import { ActivitiesController } from '@121-service/src/activities/activities.controller';
import { ActivitiesService } from '@121-service/src/activities/activities.service';

@Module({
  imports: [],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
  exports: [],
})
export class ActivitiesModule {}
