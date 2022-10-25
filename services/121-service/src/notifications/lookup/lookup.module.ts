import { Module } from '@nestjs/common';
import { LookupController } from './lookup.controller';
import { LookupService } from './lookup.service';

@Module({
  imports: [],
  providers: [LookupService],
  controllers: [LookupController],
  exports: [LookupService],
})
export class LookupModule {}
