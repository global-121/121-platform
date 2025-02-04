import { Module } from '@nestjs/common';

import { CronjobController } from '@121-service/src/cronjob/cronjob.controller';
import { CronjobService } from '@121-service/src/cronjob/cronjob.service';

@Module({
  imports: [],
  providers: [CronjobService],
  controllers: [CronjobController],
  exports: [CronjobService],
})
export class CronjobModule {}
