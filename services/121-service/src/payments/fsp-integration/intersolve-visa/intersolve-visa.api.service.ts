import {
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-block.dto';
import { IntersolveCreateCustomerResponseBodyDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer-response.dto';
import {
  IntersolveAddressDto,
  IntersolveCreateCustomerDto,
  IntersolveTypeValue,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer.dto';
import { IntersolveCreateDebitCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-debit-card.dto';
import { IntersolveCreateWalletResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import { IntersolveCreateWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet.dto';
import { IntersolveGetCardResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-card-details.dto';
import { IntersolveGetWalletResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-details.dto';
import { GetTransactionsDetailsResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-transactions.dto';
import { IntersolveLoadResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';

const intersolveVisaApiUrl = process.env.MOCK_INTERSOLVE
  ? `${process.env.MOCK_SERVICE_URL}api/fsp/intersolve-visa`
  : process.env.INTERSOLVE_VISA_API_URL;

/* All "technical details" of how the Intersolve API is called and how to get what we need from the responses should be encapsulated here. Not the IntersolveVisaService nor any other part of the
    121 Service needs to know about Intersolve API implementation details.
    Guideline: The (internal) API of the ApiService functions use FSP-specific terminology, the (IntersolveVisa)Service (externaly used API) uses "121" terminology.
*/
@Injectable()
export class IntersolveVisaApiService {
  public tokenSet: TokenSet;
  public constructor(private readonly httpService: CustomHttpService) {}

  public async getAuthenticationToken() {
    if (process.env.MOCK_INTERSOLVE) {
      return 'mocked-token';
    }
    if (this.isTokenValid(this.tokenSet)) {
      // Return cached token
      return this.tokenSet.access_token;
    }
    // If not valid, request new token
    const trustIssuer = await Issuer.discover(
      `${process.env.INTERSOLVE_VISA_OIDC_ISSUER}/.well-known/openid-configuration`,
    );
    const client = new trustIssuer.Client({
      client_id: process.env.INTERSOLVE_VISA_CLIENT_ID!,
      client_secret: process.env.INTERSOLVE_VISA_CLIENT_SECRET!,
    });
    const tokenSet = await client.grant({
      grant_type: 'client_credentials',
    });
    // Cache tokenSet
    this.tokenSet = tokenSet;
    return tokenSet.access_token;
  }

  private isTokenValid(
    tokenSet: TokenSet,
  ): tokenSet is TokenSet & Required<Pick<TokenSet, 'access_token'>> {
    if (!tokenSet || !tokenSet.expires_at) {
      return false;
    }
    // Convert expires_at to milliseconds
    const expiresAtInMs = tokenSet.expires_at * 1000;
    const timeLeftBeforeExpire = expiresAtInMs - Date.now();
    // If more than 1 minute left before expiration, the token is considered valid
    return timeLeftBeforeExpire > 60000;
  }

  public async createCustomer(
    payload: IntersolveCreateCustomerDto,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
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

  public async createWallet(
    payload: IntersolveCreateWalletDto,
    brandCode: string,
  ): Promise<IntersolveCreateWalletResponseDto> {
    const authToken = await this.getAuthenticationToken();

    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
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

  public async getWallet(
    tokenCode: string | null,
  ): Promise<IntersolveGetWalletResponseDto> {
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

  // Swagger docs https://service-integration.intersolve.nl/payment-instrument-payment/swagger/index.html
  public async getCard(
    tokenCode: string | null,
  ): Promise<IntersolveGetCardResponseDto> {
    const authToken = await this.getAuthenticationToken();
    const url = `${intersolveVisaApiUrl}/payment-instrument-payment/v1/tokens/${tokenCode}/physical-card-data`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    return await this.httpService.get<IntersolveGetCardResponseDto>(
      url,
      headers,
    );
  }

  public async getTransactions(
    tokenCode: string | null,
    dateFrom?: Date,
  ): Promise<GetTransactionsDetailsResponseDto> {
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

  public async linkCustomerToWallet(
    payload: {
      holderId: string | null;
    },
    tokenCode: string | null,
  ): Promise<any> {
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

  public async createDebitCard(
    tokenCode: string | null,
    payload: IntersolveCreateDebitCardDto,
  ): Promise<any> {
    const authToken = await this.getAuthenticationToken();
    const url = `${intersolveVisaApiUrl}/payment-instrument-payment/v1/tokens/${tokenCode}/create-physical-card`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    // On success this returns a 200 with a body containing correlationId
    return await this.httpService.post<void>(url, payload, headers);
  }

  public async loadBalanceCard(
    tokenCode: string | null,
    payload: IntersolveLoadDto,
  ): Promise<IntersolveLoadResponseDto> {
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

  public async unloadBalanceCard(
    tokenCode: string | null,
    payload: IntersolveLoadDto,
  ): Promise<IntersolveLoadResponseDto> {
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

  public async toggleBlockWallet(
    tokenCode: string | null,
    payload: IntersolveBlockWalletDto,
    block: boolean,
  ): Promise<IntersolveBlockWalletResponseDto> {
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
    const blockResult = await this.httpService.post<any>(url, payload, headers);
    const result: IntersolveBlockWalletResponseDto = {
      status: blockResult.status,
      statusText: blockResult.statusText,
      data: blockResult.data,
    };
    return result;
  }

  public async updateCustomerPhoneNumber(
    holderId: string | null,
    payload: IntersolveTypeValue,
  ): Promise<any> {
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

  public async updateCustomerAddress(
    holderId: string | null,
    payload: IntersolveAddressDto,
  ): Promise<any> {
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

  public async activateWallet(
    tokenCode: string | null,
    payload: { reference: string },
  ): Promise<IntersolveGetWalletResponseDto> {
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
