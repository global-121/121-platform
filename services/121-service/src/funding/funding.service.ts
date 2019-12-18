import { Injectable, HttpService } from '@nestjs/common';
import { FundingOverview } from './dto/funding-overview.dto';

@Injectable()
export class FundingService {
  public constructor(
    private readonly httpService: HttpService,
  ) { }

  public async getProgramFunds(programId: number): Promise<FundingOverview> {
    console.log(programId)
    const totalRaised = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
    const totalTransferred = Math.floor(Math.random() * (499 - 1 + 1)) + 1;

    const fundsDisberse = {
      totalRaised: totalRaised,
      totalTransferred: totalTransferred,
      totalAvailable: totalRaised - totalTransferred,
      updated: new Date()
    };
    return fundsDisberse
  }
}
