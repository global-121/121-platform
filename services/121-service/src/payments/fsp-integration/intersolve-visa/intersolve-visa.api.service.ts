import { CreateCustomerRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/create-customer-request.dto';
import { CreateCustomerResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/create-customer-response.dto';
import { CreatePhysicalCardRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/create-physical-card-request.dto';
import { GetPhysicalCardResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/get-physical-card-response.dto';
import { GetTokenResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/get-token-response.dto';
import { IssueTokenRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/issue-token-request.dto';
import { IssueTokenResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/issue-token-response.dto';
import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';
import { SubstituteTokenRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/substitute-token-request.dto';
import { TransferRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/transfer-request.dto';
import { TransferResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/transfer-response.dto';
import {
  GetTransactionsResponseDto,
  IntersolveGetTransactionsResponseDataDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-get-wallet-transactions.dto';
import { IntersolveBlockTokenReasonCodeEnum } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-block-token-reason-code.enum';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { CreateCustomerReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/create-customer-return-type.interface';
import { GetPhysicalCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-physical-card-return-type.interface';
import { GetTokenReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-token-return-type.interface';
import { GetTransactionInformationReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-transaction-information-return-type.interface';
import { IntersolveVisaBaseResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/intersolve-visa-api-default-reponse.interface';
import { IssueTokenReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/issue-token-return-type.interface';
import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { formatPhoneNumber } from '@121-service/src/utils/phone-number.helpers';
import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';
import { v4 as uuid, v5 as uuidv5 } from 'uuid';

const INTERSOLVE_VISA_UUID_NAMESPACE =
  process.env.INTERSOLVE_VISA_UUID_NAMESPACE || uuid();

/**
 * Generate a UUID v5 based on a seed.
 * @param seed The seed to generate the UUID.
 * @returns The generated UUID.
 */
function generateUUIDFromSeed(seed: string): string {
  return uuidv5(seed, INTERSOLVE_VISA_UUID_NAMESPACE);
}

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

  public async createCustomer(input: {
    externalReference: string;
    name: string;
    contactInformation: ContactInformation;
    estimatedAnnualPaymentVolumeMajorUnit: number;
  }): Promise<CreateCustomerReturnType> {
    // Create the request body to send
    const createCustomerRequestDto: CreateCustomerRequestDto = {
      externalReference: input.externalReference, // The IntersolveVisa does not "know about this", but we pass in the registration.referenceId here.
      individual: {
        firstName: '', // in 121 first name and last name are always combined into 1 "name" field, but Intersolve requires first name, so just give an empty string
        lastName: input.name,
        estimatedAnnualPaymentVolumeMajorUnit:
          input.estimatedAnnualPaymentVolumeMajorUnit,
      },
      contactInfo: {
        addresses: [
          {
            type: 'HOME',
            addressLine1: this.createAddressString(input.contactInformation),
            city: input.contactInformation.addressCity,
            postalCode: input.contactInformation.addressPostalCode,
            country: 'NL',
          },
        ],
        phoneNumbers: [
          {
            type: 'MOBILE',
            value: formatPhoneNumber(input.contactInformation.phoneNumber),
          },
        ],
      },
    };

    // Send the request
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'customer-payments'
      : 'customer';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/customers/create-individual`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const createCustomerResponseDto =
      await this.httpService.post<CreateCustomerResponseDto>(
        url,
        createCustomerRequestDto,
        headers,
      );

    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      createCustomerResponseDto,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.createCustomerError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    // Put relevant stuff from createCustomerResponseDto into a CreateCustomerResultDto and return
    const createCustomerResultDto: CreateCustomerReturnType = {
      holderId: createCustomerResponseDto.data.data.id,
    };
    return createCustomerResultDto;
  }

  public async issueToken(issueTokenParams: {
    brandCode: string;
    activate: boolean;
    reference?: string;
  }): Promise<IssueTokenReturnType> {
    // Create the request body to send
    const issueTokenRequestDto: IssueTokenRequestDto = {
      reference: issueTokenParams.reference
        ? issueTokenParams.reference
        : uuid(), // A UUID reference which can be used for "technical cancellation in case of time-out", which in accordance with Intersolve we do not implement.
      activate: issueTokenParams.activate,
    };
    // Send the request: https://service-integration.intersolve.nl/pointofsale/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/brand-types/${issueTokenParams.brandCode}/issue-token`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const issueTokenResponseDto =
      await this.httpService.post<IssueTokenResponseDto>(
        url,
        issueTokenRequestDto,
        headers,
      );

    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      issueTokenResponseDto,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.issueTokenError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    // Put relevant stuff from issueTokenResponseDto into a CreateCustomerResultDto and return
    const issueTokenResultDto: IssueTokenReturnType = {
      code: issueTokenResponseDto.data.data.token.code,
      blocked: issueTokenResponseDto.data.data.token.blocked || false,
      status: issueTokenResponseDto.data.data.token.status,
    };

    return issueTokenResultDto;
  }

  public async getToken(tokenCode: string): Promise<GetTokenReturnType> {
    // Send the request
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}?includeBalances=true`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const getTokenResponseDto = await this.httpService.get<GetTokenResponseDto>(
      url,
      headers,
    );

    // Handle the response

    const errorMessage =
      this.createErrorMessageIfRequestFailed(getTokenResponseDto);
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.getTokenError}: ${errorMessage}`,
      );
    }

    let blocked;
    let status;
    let balance;
    const tokenData = getTokenResponseDto.data.data;
    if (tokenData?.balances) {
      const balanceObject = tokenData.balances.find(
        (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE,
      );
      if (balanceObject) {
        balance = balanceObject.quantity.value;
      }
    }
    if (tokenData?.status) {
      status = tokenData.status;
    }
    if (tokenData?.blocked === true || tokenData?.blocked === false) {
      blocked = tokenData.blocked;
    }
    const getTokenResult: GetTokenReturnType = {
      blocked: blocked,
      status: status,
      balance: balance,
    };

    return getTokenResult;
  }

  // Swagger docs https://service-integration.intersolve.nl/payment-instrument-payment/swagger/index.html
  public async getPhysicalCard(
    tokenCode: string,
  ): Promise<GetPhysicalCardReturnType> {
    // Send the request
    const authToken = await this.getAuthenticationToken();
    const url = `${intersolveVisaApiUrl}/payment-instrument-payment/v1/tokens/${tokenCode}/physical-card-data`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const getPhysicalCardResponseDto =
      await this.httpService.get<GetPhysicalCardResponseDto>(url, headers);

    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      getPhysicalCardResponseDto,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.getPhysicalCardError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    const getPhysicalCardReturnDto: GetPhysicalCardReturnType = {
      status: getPhysicalCardResponseDto.data.data.status,
    };
    return getPhysicalCardReturnDto;
  }

  public async getTransactionInformation(
    tokenCode: string,
  ): Promise<GetTransactionInformationReturnType> {
    // get Transactions
    const getTransactionsResponseDto = await this.getTransactions({
      tokenCode,
      fromDate: this.getTwoMonthsAgo(),
    });

    // Seperate out the reservation and expired reservation transactions.
    const transactions = getTransactionsResponseDto.data.data;
    let reservationTransactions: IntersolveGetTransactionsResponseDataDto[] =
      [];
    let expiredTransactions: IntersolveGetTransactionsResponseDataDto[] = [];
    if (transactions && transactions.length > 0) {
      reservationTransactions = transactions.filter(
        (t) => t.type === 'RESERVATION',
      );
      expiredTransactions = transactions.filter(
        (t) => t.type === 'RESERVATION_EXPIRED',
      );
    }

    // Determine the last used date of the reservation transactions
    const lastTransactionDate = this.getLastTransactionDate(
      reservationTransactions,
    );

    // Calculate the amount spent this month from the reservation and expired transactions
    const spentThisMonth = this.calculateSpentThisMonth({
      walletTransactions: reservationTransactions,
      expiredReserveTransactions: expiredTransactions,
    });

    // Return relevant information
    const getTransactionInformationResultDto: GetTransactionInformationReturnType =
      {
        spentThisMonth: spentThisMonth,
        lastTransactionDate: lastTransactionDate,
      };
    return getTransactionInformationResultDto;
  }

  private async getTransactions({
    tokenCode,
    fromDate,
  }: {
    tokenCode: string;
    fromDate?: Date;
  }): Promise<GetTransactionsResponseDto> {
    // Send the request
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'wallet-payments'
      : 'wallet';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/transactions${
      fromDate ? `?dateFrom=${fromDate.toISOString()}` : ''
    }`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];

    const getTransactionsResponseDto =
      await this.httpService.get<GetTransactionsResponseDto>(url, headers);
    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      getTransactionsResponseDto,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.getTransactionError}: ${errorMessage}`,
      );
    }

    return getTransactionsResponseDto;
  }

  private getLastTransactionDate(
    walletTransactions: IntersolveGetTransactionsResponseDataDto[],
  ): null | Date {
    if (walletTransactions && walletTransactions.length > 0) {
      const sortedByDate = walletTransactions.sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      if (sortedByDate.length > 0) {
        const dateString = sortedByDate[0].createdAt;
        return new Date(dateString);
      }
    }
    return null;
  }

  private calculateSpentThisMonth({
    walletTransactions,
    expiredReserveTransactions,
  }: {
    walletTransactions: IntersolveGetTransactionsResponseDataDto[];
    expiredReserveTransactions: IntersolveGetTransactionsResponseDataDto[];
  }): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    let total = 0;
    const originalTransactionIdsOfExpiredReservations =
      expiredReserveTransactions.map((r) => r.originalTransactionId);
    for (const transaction of walletTransactions) {
      const transactionDate = new Date(transaction.createdAt);
      if (
        transactionDate.getMonth() === thisMonth &&
        transactionDate.getFullYear() === thisYear &&
        !originalTransactionIdsOfExpiredReservations.includes(transaction.id) // check that this reservation did not later expire
      ) {
        total += transaction.quantity.value;
      }
    }
    // We get back negative numbers which needs to be reversed to a positive number
    const reversed = -total;
    return reversed;
  }

  public async registerHolder({
    holderId,
    tokenCode,
  }: {
    holderId: string;
    tokenCode: string;
  }): Promise<void> {
    // Create the request body to send

    const registerHolderRequest = {
      holderId: holderId,
    };

    // Send the request
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
    const registerHolderResponse = await this.httpService.post<any>(
      url,
      registerHolderRequest,
      headers,
    );

    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      registerHolderResponse,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.resgisterHolderError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    // On success this returns a 204 No Content
  }

  // Link a (parent) token to a (child) token
  public async linkToken({
    parentTokenCode,
    childTokenCode,
  }: {
    parentTokenCode: string;
    childTokenCode: string;
  }): Promise<void> {
    // Create the request body to send
    const linkTokenRequest = {
      tokenCode: childTokenCode,
    };

    // Send the request
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'wallet-payments'
      : 'wallet';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${parentTokenCode}/link-token`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    // On success this returns a 204 No Content
    const linkTokenResponse =
      await this.httpService.post<IntersolveVisaBaseResponseDto>(
        url,
        linkTokenRequest,
        headers,
      );

    // Handle the response
    const errorMessage =
      this.createErrorMessageIfRequestFailed(linkTokenResponse);
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.linkTokenError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    // On success this returns a 204 No Content
    return;
  }

  public async createPhysicalCard({
    tokenCode,
    name,
    contactInformation,
    coverLetterCode,
  }: {
    tokenCode: string;
    name: string;
    contactInformation: ContactInformation;
    coverLetterCode: string;
  }): Promise<void> {
    // Create the request body to send
    const request: CreatePhysicalCardRequestDto = {
      brand: 'VISA_CARD',
      firstName: '',
      lastName: name,
      mobileNumber: formatPhoneNumber(contactInformation.phoneNumber), // must match \"([+]){1}([1-9]){1}([0-9]){5,14}\"
      cardAddress: {
        address1: this.createAddressString(contactInformation),
        city: contactInformation.addressCity,
        country: 'NLD',
        postalCode: contactInformation.addressPostalCode,
      },
      pinAddress: {
        address1: this.createAddressString(contactInformation),
        city: contactInformation.addressCity,
        country: 'NLD',
        postalCode: contactInformation.addressPostalCode,
      },
      pinStatus: 'D',
      coverLetterCode: coverLetterCode,
    };

    // Send the request: https://service-integration.intersolve.nl/payment-instrument-payment/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const url = `${intersolveVisaApiUrl}/payment-instrument-payment/v1/tokens/${tokenCode}/create-physical-card`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    // On success this returns a 200 with a body containing correlationId
    const createPhysicalCardResponse =
      await this.httpService.post<IntersolveVisaBaseResponseDto>(
        url,
        request,
        headers,
      );

    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      createPhysicalCardResponse,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.createPhysicalCardError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    return;
  }

  public async transfer({
    fromTokenCode,
    toTokenCode,
    amount: amountInMajorUnit,
    reference,
  }: {
    fromTokenCode: string;
    toTokenCode: string;
    amount: number;
    reference: string;
  }): Promise<void> {
    const uuid = generateUUIDFromSeed(reference);
    const amountInCent = amountInMajorUnit * 100;

    const transferRequestDto: TransferRequestDto = {
      quantity: {
        value: amountInCent,
        assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE!,
      },
      creditor: {
        tokenCode: toTokenCode,
      },
      reference: reference.slice(0, 128), // String of max 128 characters, does not need to be unique for every transfer.
      operationReference: uuid, // Required to pass in a UUID, which needs be unique for all transfers. Is used as idempotency key.
    };

    // Send the request: https://service-integration.intersolve.nl/wallet/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'wallet-payments'
      : 'wallet';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${fromTokenCode}/transfer`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const transferResponse = await this.httpService.post<TransferResponseDto>(
      url,
      transferRequestDto,
      headers,
    );

    // Handle the response

    const errorMessage =
      this.createErrorMessageIfRequestFailed(transferResponse);
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.transferError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    return;
  }

  public async substituteToken({
    oldTokenCode,
    newTokenCode,
  }: {
    oldTokenCode: string;
    newTokenCode: string;
  }): Promise<void> {
    // Create the request body to send

    const substituteTokenRequestDto: SubstituteTokenRequestDto = {
      tokenCode: newTokenCode,
    };

    // Send the request: https://service-integration.intersolve.nl/wallet/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'wallet-payments'
      : 'wallet';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${oldTokenCode}/substitute-token`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    // On success this returns a 204 No Content
    const substituteTokenResponse =
      await this.httpService.post<IntersolveVisaBaseResponseDto>(
        url,
        substituteTokenRequestDto,
        headers,
      );

    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      substituteTokenResponse,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.substituteTokenError}: ${errorMessage}`,
      );
    }

    // If the response does not contain errors
    return;
  }

  public async setTokenBlocked(
    tokenCode: string,
    blocked: boolean,
  ): Promise<void> {
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/${
      blocked ? 'block' : 'unblock'
    }`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const payload = {
      reasonCode: blocked
        ? IntersolveBlockTokenReasonCodeEnum.BLOCK_GENERAL
        : IntersolveBlockTokenReasonCodeEnum.UNBLOCK_GENERAL,
    };
    const blockResult = await this.httpService.post<any>(url, payload, headers);

    const errorMessage = this.createErrorMessageIfRequestFailed(blockResult);
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.blockTokenError}: ${errorMessage}`,
      );
    }

    return;
  }

  public async updateCustomerPhoneNumber({
    holderId,
    phoneNumber,
  }: {
    holderId: string;
    phoneNumber: string;
  }): Promise<any> {
    // Create the request

    const requestBody = {
      type: 'MOBILE',
      value: formatPhoneNumber(phoneNumber),
    };

    // Send the request: https://service-integration.intersolve.nl/customer/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'customer-payments'
      : 'customer';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/customers/${holderId}/contact-info/phone-numbers`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const response = await this.httpService.put<any>(url, requestBody, headers);

    // Handle the response
    const errorMessage = this.createErrorMessageIfRequestFailed(response);
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.updatePhoneNumberError}: ${errorMessage}`,
      );
    }
  }

  public async updateCustomerAddress({
    holderId,
    addressStreet,
    addressHouseNumber,
    addressHouseNumberAddition,
    addressPostalCode,
    addressCity,
  }: {
    holderId: string;
    addressStreet: string;
    addressHouseNumber: string;
    addressHouseNumberAddition: string | undefined;
    addressPostalCode: string;
    addressCity: string;
  }): Promise<void> {
    // Create the request
    const requestBody = {
      type: 'HOME',
      addressLine1: `${
        addressStreet + ' ' + addressHouseNumber + addressHouseNumberAddition
      }`,
      city: addressCity,
      postalCode: addressPostalCode,
      country: 'NL',
    };

    // Send the request: https://service-integration.intersolve.nl/customer/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'customer-payments'
      : 'customer';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/customers/${holderId}/contact-info/addresses`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    const response = await this.httpService.put<any>(url, requestBody, headers);

    // Handle the response
    const errorMessage = this.createErrorMessageIfRequestFailed(response);
    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(
        `${IntersolveVisa121ErrorText.updatePhoneNumberError}: ${errorMessage}`,
      );
    }

    return;
  }

  // Helper function to convert errors in an Intersolve API Response into a message string.
  private convertResponseErrorsToMessage(
    errorsInResponseDto: ErrorsInResponse[] | undefined,
  ): string {
    if (
      !errorsInResponseDto ||
      !Array.isArray(errorsInResponseDto) ||
      !errorsInResponseDto.length
    ) {
      return '';
    }
    let message = '';
    for (const [i, error] of errorsInResponseDto.entries()) {
      const newLine = i < errorsInResponseDto.length - 1 ? '\n' : '';
      message = `${message}${error.code}: ${error.description} Field: ${error.field}${newLine}`;
    }
    return message;
  }

  private isSuccessResponseStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  private createErrorMessageIfRequestFailed(
    response: IntersolveVisaBaseResponseDto,
  ): string | undefined {
    if (!response) {
      return 'Intersolve URL could not be reached.';
    }
    if (!response.status) {
      return "Intersolve response did not contain a 'status' field.";
    }
    if (!response.statusText) {
      return "Intersolve response did not contain a 'statusText' field.";
    }
    if (!this.isSuccessResponseStatus(response.status)) {
      return `${
        this.convertResponseErrorsToMessage(response.data?.errors) ||
        `${response.status} - ${response.statusText}`
      }`;
    } else {
      return undefined;
    }
  }

  private getTwoMonthsAgo(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date;
  }

  private createAddressString(contactInformation: ContactInformation) {
    return `${contactInformation.addressStreet} ${contactInformation.addressHouseNumber} ${contactInformation.addressHouseNumberAddition ?? ''}`.trim();
  }
}
