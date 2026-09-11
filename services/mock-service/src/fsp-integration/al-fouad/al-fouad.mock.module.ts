import { Module } from '@nestjs/common';

import { AlFouadMockController } from '@mock-service/src/fsp-integration/al-fouad/al-fouad.mock.controller';
import { AlFouadMockService } from '@mock-service/src/fsp-integration/al-fouad/al-fouad.mock.service';

@Module({
  controllers: [AlFouadMockController],
  providers: [AlFouadMockService],
  exports: [AlFouadMockService],
})
export class AlFouadMockModule {}
