import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { KoboMockController } from '@mock-service/src/kobo/kobo.mock.controller';
import { KoboMockService } from '@mock-service/src/kobo/kobo.mock.service';

@Module({
  imports: [HttpModule],
  providers: [KoboMockService],
  controllers: [KoboMockController],
  exports: [KoboMockService],
})
export class KoboMockModule {}
