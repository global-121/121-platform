import { DisberseApiService } from './disberse-api.service';
import { Injectable } from '@nestjs/common';
import { FundingOverview } from './dto/funding-overview.dto';

@Injectable()
export class FundingService {
  public constructor(
    private readonly disberseApiService: DisberseApiService,
  ) {}

  public async getProgramFunds(disberseProgramId: string): Promise<FundingOverview> {
    const totalAvailable = await this.disberseApiService.balance(disberseProgramId);
    const fundsDisberse = {
      totalAvailable: totalAvailable,
      updated: new Date(),
    };
    return fundsDisberse;
  }
}
