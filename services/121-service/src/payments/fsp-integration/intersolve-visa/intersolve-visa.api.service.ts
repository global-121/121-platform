import { Injectable } from '@nestjs/common';
import { Issuer } from 'openid-client';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { IntersolveIssueTokenResponseDto } from './dto/intersolve-issue-token-response.dto';
import { IntersolveIssueTokenDto } from './dto/intersolve-issue-token.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveVisaApiMockService } from './intersolve-visa-api-mock.services';

const intersolveVisaApiUrl = process.env.INTERSOLVE_VISA_API_URL;

@Injectable()
export class IntersolveVisaApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly intersolveVisaApiMockService: IntersolveVisaApiMockService,
  ) {}

  public async getAuthenticationToken(): Promise<string> {
    const trustIssuer = await Issuer.discover(
      `${process.env.INTERSOLVE_VISA_OIDC_ISSUER}/.well-known/openid-configuration`,
    );
    const client = new trustIssuer.Client({
      client_id: process.env.INTERSOLVE_VISA_CLIENT_ID,
      client_secret: process.env.INTERSOLVE_VISA_CLIENT_SECRET,
    });
    const tokenSet = await client.grant({
      grant_type: 'client_credentials',
    });
    return tokenSet.access_token;
  }

  public async issueToken(
    payload: IntersolveIssueTokenDto,
  ): Promise<IntersolveIssueTokenResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.issueTokenMock();
    } else {
      const authToken = await this.getAuthenticationToken();
      const brandCode = process.env.INTERSOLVE_VISA_BRAND_CODE;
      const url = `${intersolveVisaApiUrl}/brand-types/${brandCode}/issue-token`;
      return await this.httpService.post<IntersolveIssueTokenResponseDto>(
        url,
        payload,
        authToken,
      );
    }
  }

  public async topUpCard(
    tokenCode: string,
    payload: IntersolveLoadDto,
  ): Promise<IntersolveLoadResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.topUpCardMock(
        payload.quantities[0].quantity.value,
      );
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/tokens/${tokenCode}/transfers`;
      return await this.httpService.post<IntersolveLoadResponseDto>(
        url,
        payload,
        authToken,
      );
    }
  }
}
