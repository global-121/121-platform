import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [LookupService],
  exports: [LookupService],
})
export class LookupModule {}
