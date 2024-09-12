import { Module } from '@nestjs/common';

import { SafaricomMockController } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.controller';
import { SafaricomMockService } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.service';

@Module({
  imports: [],
  providers: [SafaricomMockService],
  controllers: [SafaricomMockController],
  exports: [SafaricomMockService],
})
export class SafaricomMockModule {}
