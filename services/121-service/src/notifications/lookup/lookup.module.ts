import { Module } from '@nestjs/common';
import { LookupService } from './lookup.service';
import { LookupController } from './lookup.controller';

@Module({
  imports: [],
  providers: [LookupService],
  controllers: [LookupController],
  exports: [LookupService],
})
export class LookupModule {}
