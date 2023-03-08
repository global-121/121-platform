import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { IntersolveActivateTokenRequestDto } from './dto/intersolve-activate-token-request.dto';
import { IntersolveActivateTokenResponseDto } from './dto/intersolve-activate-token-response.dto';
import {
  IntersolveCreateCustomerResponseBodyDto,
  IntersolveGetCustomerResponseBodyDto,
} from './dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import { IntersolveCreateVirtualCardDto } from './dto/intersolve-create-virtual-card.dto';
import { IntersolveGetVirtualCardResponseDto } from './dto/intersolve-get-virtual-card-response.dto';
import { IntersolveIssueTokenResponseDto } from './dto/intersolve-issue-token-response.dto';
import { IntersolveIssueTokenDto } from './dto/intersolve-issue-token.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveVisaApiMockService } from './intersolve-visa-api-mock.service';

export enum IntersolveVisaEndpoints {
  LOAD = 'load',
  ACTIVATE = 'activate',
  ISSUE_TOKEN = 'issue-token',
}

const intersolveVisaApiUrl = process.env.INTERSOLVE_VISA_API_URL;

@Injectable()
export class IntersolveVisaApiService {
  public tokenSet: TokenSet;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly intersolveVisaApiMockService: IntersolveVisaApiMockService,
  ) {}

  public async getAuthenticationToken(): Promise<string> {
    // Check expires_at
    if (this.tokenSet && this.tokenSet.expires_at > Date.now() - 60000) {
      // Return cached token
      return this.tokenSet.access_token;
    } else {
      // If not valid, request new token
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
      // Cache tokenSet
      this.tokenSet = tokenSet;
      return tokenSet.access_token;
    }
  }

  public async getCustomer(
    holderId: string,
  ): Promise<IntersolveGetCustomerResponseBodyDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.getCustomerMock();
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/customer/v1/customers/${holderId}/individual`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.get<IntersolveGetCustomerResponseBodyDto>(
        url,
        headers,
      );
    }
  }

  public async createCustomer(
    payload: IntersolveCreateCustomerDto,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.createCustomerMock(payload);
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/customer/v1/customers/create-individual`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.post<IntersolveCreateCustomerResponseBodyDto>(
        url,
        payload,
        headers,
      );
    }
  }

  public async registerHolder(
    payload: {
      holderId: string;
    },
    tokenCode: string,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.registerHolderMock(tokenCode);
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/wallet/v1/tokens/${tokenCode}/register-holder`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      // On success this returns a 204 No Content
      return await this.httpService.post<any>(url, payload, headers);
    }
  }

  public async issueToken(
    payload: IntersolveIssueTokenDto,
  ): Promise<IntersolveIssueTokenResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.issueTokenMock(payload.holderId);
    } else {
      const authToken = await this.getAuthenticationToken();
      const brandCode = process.env.INTERSOLVE_VISA_BRAND_CODE;
      const url = `${intersolveVisaApiUrl}/wallet/v1/brand-types/${brandCode}/issue-token`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.post<IntersolveIssueTokenResponseDto>(
        url,
        payload,
        headers,
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
      const url = `${intersolveVisaApiUrl}/pointofsale/v1/tokens/${tokenCode}/load`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.post<IntersolveLoadResponseDto>(
        url,
        payload,
        headers,
      );
    }
  }

  public async activateToken(
    tokenCode: string,
    payload: IntersolveActivateTokenRequestDto,
  ): Promise<IntersolveActivateTokenResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.activateCardMock(tokenCode);
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/pointofsale/v1/tokens/${tokenCode}/activate`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.post<IntersolveActivateTokenResponseDto>(
        url,
        payload,
        headers,
      );
    }
  }

  public async createVirtualCard(
    tokenCode: string,
    payload: IntersolveCreateVirtualCardDto,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.createVirtualCardMock(tokenCode);
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/paymentinstrument/v1/tokens/${tokenCode}/create-virtual-card`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      // On success this returns a 200 without content
      return await this.httpService.post<void>(url, payload, headers);
    }
  }

  public async getVirtualCard(tokenCode: string) {
    if (process.env.MOCK_INTERSOLVE) {
      return this.intersolveVisaApiMockService.getVirtualCardMock(tokenCode);
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/paymentinstrument/v1/tokens/${tokenCode}/card-data`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.get<IntersolveGetVirtualCardResponseDto>(
        url,
        headers,
      );
    }
  }
}
