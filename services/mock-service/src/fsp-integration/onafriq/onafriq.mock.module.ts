import { Module } from '@nestjs/common';

import { OnafriqMockController } from '@mock-service/src/fsp-integration/onafriq/onafriq.mock.controller';
import { OnafriqMockService } from '@mock-service/src/fsp-integration/onafriq/onafriq.mock.service';

@Module({
  imports: [],
  providers: [OnafriqMockService],
  controllers: [OnafriqMockController],
  exports: [OnafriqMockService],
})
export class OnafriqMockModule {}
