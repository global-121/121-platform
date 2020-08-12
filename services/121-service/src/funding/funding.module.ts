import { IntersolveApiService } from './intersolve-api.service';
import { FundingService } from './funding.service';
import { Module, HttpModule } from '@nestjs/common';
import { ApiService } from './api.service';

@Module({
  imports: [HttpModule],
  providers: [FundingService, IntersolveApiService, ApiService],
  exports: [FundingService, IntersolveApiService, ApiService],
})
export class FundingModule {}
