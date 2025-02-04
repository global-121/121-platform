import { Module } from '@nestjs/common';

import { CronjobController } from '@121-service/src/cronjob/cronjob.controller';
import { CronjobService } from '@121-service/src/cronjob/cronjob.service';

// TODO: REFACTOR: Rename to CronJobsModule (plural), including service, controller, file names, ...
@Module({
  imports: [],
  providers: [CronjobService],
  controllers: [CronjobController],
  exports: [CronjobService],
})
export class CronjobModule {}
