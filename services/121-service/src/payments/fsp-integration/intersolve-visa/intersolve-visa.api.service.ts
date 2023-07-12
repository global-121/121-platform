import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import {
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
} from './dto/intersolve-block.dto';
import { IntersolveCreateCustomerResponseBodyDto } from './dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import { IntersolveCreateDebitCardDto } from './dto/intersolve-create-debit-card.dto';
import { IntersolveCreateWalletResponseDto } from './dto/intersolve-create-wallet-response.dto';
import { IntersolveCreateWalletDto } from './dto/intersolve-create-wallet.dto';
import { IntersolveGetWalletResponseDto } from './dto/intersolve-get-wallet-details.dto';
import { GetTransactionsDetailsResponseDto } from './dto/intersolve-get-wallet-transactions.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveVisaApiMockService } from './intersolve-visa-api-mock.service';

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

  public async createCustomer(
    payload: IntersolveCreateCustomerDto,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.createCustomerMock(
        payload,
      );
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

  public async createWallet(
    payload: IntersolveCreateWalletDto,
  ): Promise<IntersolveCreateWalletResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.createWalletMock(
        payload.reference,
      );
    } else {
      const authToken = await this.getAuthenticationToken();
      const brandCode = process.env.INTERSOLVE_VISA_BRAND_CODE;
      const url = `${intersolveVisaApiUrl}/pointofsale/v1/brand-types/${brandCode}/issue-token?includeBalances=true`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.post<IntersolveCreateWalletResponseDto>(
        url,
        payload,
        headers,
      );
    }
  }

  public async getWallet(
    tokenCode: string,
  ): Promise<IntersolveGetWalletResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.getWalletMock(tokenCode);
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/pointofsale/v1/tokens/${tokenCode}?includeBalances=true`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.get<IntersolveGetWalletResponseDto>(
        url,
        headers,
      );
    }
  }

  public async getTransactions(
    tokenCode: string,
  ): Promise<GetTransactionsDetailsResponseDto> {
    // TO DO: implement mock
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.getTransactionsMock(
        tokenCode,
      );
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/wallet/v1/tokens/${tokenCode}/transactions`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.get<any>(url, headers);
    }
  }

  public async linkCustomerToWallet(
    payload: {
      holderId: string;
    },
    tokenCode: string,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.linkCustomerToWalletMock(
        tokenCode,
      );
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

  public async createDebitCard(
    tokenCode: string,
    payload: IntersolveCreateDebitCardDto,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.createDebitCardMock(
        tokenCode,
      );
    } else {
      const authToken = await this.getAuthenticationToken();
      const url = `${intersolveVisaApiUrl}/payment-instrument-payment/v1/tokens/${tokenCode}/create-physical-card`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      // On success this returns a 200 with a body containing correlationId
      return await this.httpService.post<void>(url, payload, headers);
    }
  }

  public async loadBalanceCard(
    tokenCode: string,
    payload: IntersolveLoadDto,
  ): Promise<IntersolveLoadResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.loadBalanceCardMock(
        tokenCode,
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

  public async toggleBlockWallet(
    tokenCode: string,
    payload: IntersolveBlockWalletDto,
    block: boolean,
  ): Promise<IntersolveBlockWalletResponseDto> {
    // TO DO: implement mock
    // if (process.env.MOCK_INTERSOLVE) {
    //   return await this.intersolveVisaApiMockService.toggleBlockWalletMock(
    //     tokenCode, block,
    //   );
    // } else {
    const authToken = await this.getAuthenticationToken();
    const url = `${intersolveVisaApiUrl}/pointofsale/v1/tokens/${tokenCode}/${
      block ? 'block' : 'unblock'
    }`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const blockResult = await this.httpService.post<any>(url, payload, headers);
    const result: IntersolveBlockWalletResponseDto = {
      status: blockResult.status,
      statusText: blockResult.statusText,
      data: blockResult.data,
    };
    return result;
    // }
  }

  // public async unblockWallet(
  //   tokenCode: string,
  //   payload: IntersolveUnblockWalletDto,
  // ): Promise<IntersolveBlockWalletResponseDto> {
  //   // TO DO: implement mock
  //   // if (process.env.MOCK_INTERSOLVE) {
  //   //   return await this.intersolveVisaApiMockService.unblockWalletMock(
  //   //     tokenCode,
  //   //   );
  //   // } else {
  //   const authToken = await this.getAuthenticationToken();
  //   const url = `${intersolveVisaApiUrl}/pointofsale/v1/tokens/${tokenCode}/unblock`;
  //   const headers = [
  //     { name: 'Authorization', value: `Bearer ${authToken}` },
  //     { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
  //   ];
  //   // On success this returns a 204 No Content
  //   return await this.httpService.post<any>(url, payload, headers);
  //   // }
  // }
}
