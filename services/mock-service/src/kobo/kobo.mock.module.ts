import { Module } from '@nestjs/common';

import { KoboMockController } from '@mock-service/src/kobo/kobo.mock.controller';
import { KoboMockService } from '@mock-service/src/kobo/kobo.mock.service';

@Module({
  imports: [],
  providers: [KoboMockService],
  controllers: [KoboMockController],
  exports: [KoboMockService],
})
export class KoboMockModule {}
