import { Module } from '@nestjs/common';

import { AlfouadMockController } from '@mock-service/src/fsp-integration/alfouad/alfouad.mock.controller';
import { AlfouadMockService } from '@mock-service/src/fsp-integration/alfouad/alfouad.mock.service';

@Module({
  controllers: [AlfouadMockController],
  providers: [AlfouadMockService],
  exports: [AlfouadMockService],
})
export class AlfouadMockModule {}
