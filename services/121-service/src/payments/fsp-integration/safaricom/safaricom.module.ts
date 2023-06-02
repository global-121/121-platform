import { Module } from '@nestjs/common';
import { SafaricomController } from './safaricom.controller';
import { SafaricomService } from './safaricom.service';

@Module({
  controllers: [SafaricomController],
  providers: [SafaricomService],
})
export class SafaricomModule {}
