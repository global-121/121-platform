import { Injectable, HttpService } from '@nestjs/common';
import { FundingOverview } from './dto/funding-overview.dto';

@Injectable()
export class FundingService {
  public constructor(private readonly httpService: HttpService) {}

  public async getProgramFunds(programId: number): Promise<FundingOverview> {
    const totalRaised = Math.floor(Math.random() * (100000 - 500 + 1)) + 500;
    const totalTransferred = Math.floor(Math.random() * (49999 - 1 + 1)) + 1;

    const fundsDisberse = {
      totalRaised: totalRaised,
      totalTransferred: totalTransferred,
      totalAvailable: totalRaised - totalTransferred,
      updated: new Date(),
    };
    return fundsDisberse;
  }
}
