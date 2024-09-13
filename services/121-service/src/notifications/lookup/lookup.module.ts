import { Module } from '@nestjs/common';

import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';

@Module({
  imports: [],
  providers: [LookupService],
  exports: [LookupService],
})
export class LookupModule {}
