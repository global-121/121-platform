import { Module } from '@nestjs/common';

import { MtnMockController } from '@mock-service/src/fsp-integration/mtn/mtn.mock.controller';
import { MtnMockService } from '@mock-service/src/fsp-integration/mtn/mtn.mock.service';

@Module({
  imports: [],
  providers: [MtnMockService],
  controllers: [MtnMockController],
  exports: [MtnMockService],
})
export class MtnMockModule {}
