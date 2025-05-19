import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Injectable()
export class AirtelApiService {
  private tokenSet: TokenSet;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly tokenValidationService: TokenValidationService,
  ) {}

  private async authenticate(): Promise<void> {
    // ## TODO: implement, probably reuse safaricom stuff
  }

  public async disburse(): Promise<void> {
    // ## TODO: implement
  }

  public async enquire(): Promise<void> {
    // ## TODO: implement
  }
}
