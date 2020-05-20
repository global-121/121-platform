import { DisberseApiService } from './disberse-api.service';
import { FundingService } from './funding.service';
import { Module, HttpModule } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [FundingService, DisberseApiService],
  exports: [FundingService],
})
export class FundingModule {}
