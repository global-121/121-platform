import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { MtnMockController } from '@mock-service/src/fsp-integration/mtn/mtn.mock.controller';
import { MtnMockService } from '@mock-service/src/fsp-integration/mtn/mtn.mock.service';

@Module({
  imports: [HttpModule],
  controllers: [MtnMockController],
  providers: [MtnMockService],
  exports: [MtnMockService],
})
export class MtnMockModule {}
