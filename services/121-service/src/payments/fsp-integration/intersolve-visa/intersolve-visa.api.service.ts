import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import {
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
} from './dto/intersolve-block.dto';
import { IntersolveCreateCustomerResponseBodyDto } from './dto/intersolve-create-customer-response.dto';
import {
  IntersolveAddressDto,
  IntersolveCreateCustomerDto,
  IntersolveTypeValue,
} from './dto/intersolve-create-customer.dto';
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
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'customer-payments'
        : 'customer';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/customers/create-individual`;
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
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'pointofsale-payments'
        : 'pointofsale';
      const brandCode = process.env.INTERSOLVE_VISA_BRAND_CODE;
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/brand-types/${brandCode}/issue-token?includeBalances=true`;
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
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'pointofsale-payments'
        : 'pointofsale';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}?includeBalances=true`;
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
    dateFrom?: Date,
  ): Promise<GetTransactionsDetailsResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.getTransactionsMock(
        tokenCode,
      );
    } else {
      const authToken = await this.getAuthenticationToken();
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'wallet-payments'
        : 'wallet';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/transactions${
        dateFrom ? `?dateFrom=${dateFrom.toISOString()}` : ''
      }`;
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
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'wallet-payments'
        : 'wallet';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/register-holder`;
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
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'pointofsale-payments'
        : 'pointofsale';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/load`;
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

  public async unloadBalanceCard(
    tokenCode: string,
    payload: IntersolveLoadDto,
  ): Promise<IntersolveLoadResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.unloadBalanceCardMock();
    } else {
      const authToken = await this.getAuthenticationToken();
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'pointofsale-payments'
        : 'pointofsale';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/unload`;
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
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.toggleBlockWalletMock();
    } else {
      const authToken = await this.getAuthenticationToken();
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'pointofsale-payments'
        : 'pointofsale';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/${
        block ? 'block' : 'unblock'
      }`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      const blockResult = await this.httpService.post<any>(
        url,
        payload,
        headers,
      );
      const result: IntersolveBlockWalletResponseDto = {
        status: blockResult.status,
        statusText: blockResult.statusText,
        data: blockResult.data,
      };
      return result;
    }
  }

  public async updateCustomerPhoneNumber(
    holderId: string,
    payload: IntersolveTypeValue,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.updateCustomerPhoneNumber();
    } else {
      const authToken = await this.getAuthenticationToken();
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'customer-payments'
        : 'customer';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/customers/${holderId}/contact-info/phone-numbers`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      const rawResult = await this.httpService.put<any>(url, payload, headers);
      const result = {
        status: rawResult.status,
        statusText: rawResult.statusText,
        data: rawResult.data,
      };
      return result;
    }
  }

  public async updateCustomerAddress(
    holderId: string,
    payload: IntersolveAddressDto,
  ): Promise<any> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.updateCustomerAddress();
    } else {
      const authToken = await this.getAuthenticationToken();
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'customer-payments'
        : 'customer';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/customers/${holderId}/contact-info/addresses`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      const rawResult = await this.httpService.put<any>(url, payload, headers);
      const result = {
        status: rawResult.status,
        statusText: rawResult.statusText,
        data: rawResult.data,
      };
      return result;
    }
  }

  public async activateWallet(
    tokenCode: string,
    payload: { reference: string },
  ): Promise<IntersolveGetWalletResponseDto> {
    if (process.env.MOCK_INTERSOLVE) {
      return await this.intersolveVisaApiMockService.activateWalletMock(
        tokenCode,
      );
    } else {
      const authToken = await this.getAuthenticationToken();
      const apiPath = process.env.INTERSOLVE_VISA_PROD
        ? 'pointofsale-payments'
        : 'pointofsale';
      const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/activate`;
      const headers = [
        { name: 'Authorization', value: `Bearer ${authToken}` },
        { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
      ];
      return await this.httpService.post<IntersolveGetWalletResponseDto>(
        url,
        payload,
        headers,
      );
    }
  }
}
