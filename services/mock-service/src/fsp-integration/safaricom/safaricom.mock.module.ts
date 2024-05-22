import { SafaricomMockController } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.controller';
import { SafaricomMockService } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [SafaricomMockService],
  controllers: [SafaricomMockController],
  exports: [SafaricomMockService],
})
export class SafaricomMockModule {}
