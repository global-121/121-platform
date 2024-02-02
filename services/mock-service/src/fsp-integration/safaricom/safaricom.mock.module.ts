import { Module } from '@nestjs/common';
import { SafaricomMockController } from './safaricom.mock.controller';
import { SafaricomMockService } from './safaricom.mock.service';

@Module({
  imports: [],
  providers: [SafaricomMockService],
  controllers: [SafaricomMockController],
  exports: [SafaricomMockService],
})
export class SafaricomMockModule {}
