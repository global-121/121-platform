import { Injectable, HttpService } from '@nestjs/common';

@Injectable()
export class FundingService {
  public constructor(
    private readonly httpService: HttpService,
  ) { }

  public async getProgramFunds(programId: number): Promise<number> {

    return 1000
  }
}
