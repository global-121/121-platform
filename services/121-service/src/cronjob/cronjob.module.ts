import { Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';

@Module({
  imports: [],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}
