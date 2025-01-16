import { Module } from '@nestjs/common';

import { CronjobService } from '@121-service/src/cronjob/cronjob.service';

@Module({
  imports: [],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}
