import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ActivityInfoMockController } from '@mock-service/src/activityinfo/activityinfo.mock.controller';
import { ActivityInfoMockService } from '@mock-service/src/activityinfo/activityinfo.mock.service';

@Module({
  imports: [HttpModule],
  providers: [ActivityInfoMockService],
  controllers: [ActivityInfoMockController],
  exports: [ActivityInfoMockService],
})
export class ActivityInfoMockModule {}
