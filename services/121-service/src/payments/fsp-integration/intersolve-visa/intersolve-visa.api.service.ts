import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import { IntersolveIssueTokenResponseDto } from './dto/intersolve-issue-token-response.dto';
import { IntersolveIssueTokenDto } from './dto/intersolve-issue-token.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveVisaApiMockService } from './intersolve-visa-api-mock.services';

@Injectable()
export class IntersolveVisaApiService {
  public constructor(
    private readonly httpService: HttpService,
    private readonly intersolveVisaApiMockService: IntersolveVisaApiMockService,
  ) {}

  public async issueToken(
    payload: IntersolveIssueTokenDto,
    authorizationToken?: string,
  ): Promise<IntersolveIssueTokenResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.issueTokenMock();
    } else {
      const code = '9999'; // WE NEED TO GET THIS FROM INTERSOLVE
      return await this.post(
        `brand-types/${code}/issue-token`,
        payload,
        authorizationToken,
      );
    }
  }

  public async topUpCard(
    tokenCode: string,
    payload: IntersolveLoadDto,
    authorizationToken?: string,
  ): Promise<IntersolveLoadResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.topUpCardMock(
        payload.quantities[0].quantity.value,
      );
    } else {
      return await this.post(
        `tokens/${tokenCode}/transfers`,
        payload,
        authorizationToken,
      );
    }
  }

  private async post(
    endpoint: string,
    payload: any,
    authorizationToken?: string,
  ): Promise<any> {
    const url = `${process.env.INTERSOLVE_VISA_URL}/${endpoint}`;
    return await lastValueFrom(
      this.httpService
        .post(url, payload, {
          headers: this.createHeaders(authorizationToken),
        })
        .pipe(
          map((response) => {
            return response;
          }),
          catchError((err) => {
            return of(err.response);
          }),
        ),
    );
  }

  private createHeaders(authorizationToken?: string): object {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authorizationToken) {
      headers['Authorization'] = `Bearer ${authorizationToken}`;
    }
    return headers;
  }
}
