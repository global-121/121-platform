import { Module } from '@nestjs/common';

import { NedbankMockController } from '@mock-service/src/fsp-integration/nedbank/nedbank.mock.controller';
import { NedbankMockService } from '@mock-service/src/fsp-integration/nedbank/nedbank.mock.service';

@Module({
  imports: [],
  providers: [NedbankMockService],
  controllers: [NedbankMockController],
  exports: [NedbankMockService],
})
export class NedbankMockModule {}
