import { FundingService } from './funding.service';
import { Module, HttpModule } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [FundingService],
  exports: [FundingService],
})
export class FundingModule {}
