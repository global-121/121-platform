import { CreateCustomerResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-customer-result.dto';
import { CreateCustomerDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-customer.dto';
import { CreatePhysicalCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-physical-card.dto';
import { GetPhysicalCardReturnDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-physical-card-return.dto';
import { GetTokenResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-token-result.dto';
import { GetTransactionInformationResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-transaction-information-result.dto';
import {
  BlockWalletReasonCodeEnum,
  BlockWalletResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/block-wallet-response.dto';
import { CreateCustomerRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-request.dto';
import { CreateCustomerResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-response.dto';
import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { GetPhysicalCardResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/get-physical-card-response.dto';
import { GetTokenResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/get-token-response.dto';
import { IssueTokenRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/issue-token-request.dto';
import { SubstituteTokenRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/substitute-token-request.dto';
import { TransferRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/transfer-request.dto';
import { TransferResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/transfer-response.dto';
import { IssueTokenResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/issue-token-result.dto';
import { IssueTokenDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/issue-token.dto';
import { TransferDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/transfer.dto';
import { IssueTokenResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import {
  GetTransactionsResponseDto,
  IntersolveGetTransactionsResponseDataDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-transactions.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';
import { v4 as uuid } from 'uuid';

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
    createCustomerDto: CreateCustomerDto,
  ): Promise<CreateCustomerResultDto> {
    // Create the request body to send
    const createCustomerRequestDto: CreateCustomerRequestDto = {
      externalReference: createCustomerDto.externalReference, // The IntersolveVisa does not "know about this", but we pass in the registration.referenceId here.
      individual: {
        firstName: '', // in 121 first name and last name are always combined into 1 "name" field, but Intersolve requires first name, so just give an empty string
        lastName: createCustomerDto.name,
        estimatedAnnualPaymentVolumeMajorUnit:
          createCustomerDto.estimatedAnnualPaymentVolumeMajorUnit,
      },
      contactInfo: {
        addresses: [
          {
            type: 'HOME',
            addressLine1: createCustomerDto.addressStreet,
            city: createCustomerDto.addressCity,
            postalCode: createCustomerDto.addressPostalCode,
            country: 'NL',
          },
        ],
        phoneNumbers: [
          {
            type: 'MOBILE',
            value: createCustomerDto.phoneNumber, // TODO: Why in createPhysicalCard() do we call formatPhoneNumber() on this value, but not here? Bug or intentional?
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
      throw new Error(`CREATE CUSTOMER ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    // Put relevant stuff from createCustomerResponseDto into a CreateCustomerResultDto and return
    const createCustomerResultDto: CreateCustomerResultDto = {
      holderId: createCustomerResponseDto.data.data.id, // TODO: Also check if there is actually something in this id and if not, throw an exception?
    };
    return createCustomerResultDto;
  }

  public async issueToken(
    issueTokenDto: IssueTokenDto,
  ): Promise<IssueTokenResultDto> {
    // Create the request body to send
    const issueTokenRequestDto: IssueTokenRequestDto = {
      reference: uuid(), // A UUID reference which can be used for "technical cancellation in case of time-out", which in accordance with Intersolve we do not implement.
      activate: issueTokenDto.activate,
      // TODO: Can we just leave out quantities altogether from the request like this? Or does it need to be an empty array like it shows in the Integration Manual?
    };
    // Send the request: https://service-integration.intersolve.nl/pointofsale/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/brand-types/${issueTokenDto.brandCode}/issue-token`; // TODO: Removed this: ?includeBalances=true, which I think is ok.
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
      throw new Error(`ISSUE TOKEN ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    // Put relevant stuff from issueTokenResponseDto into a CreateCustomerResultDto and return
    const issueTokenResultDto: IssueTokenResultDto = {
      code: issueTokenResponseDto.data.data.token.code,
      blocked: issueTokenResponseDto.data.data.token.blocked || false,
      status: issueTokenResponseDto.data.data.token.status,
    };

    return issueTokenResultDto;
  }

  // TODO: Remove this function when no longer called from the IntersolveVisaService (i.e. after refactoring), this function is replaced by this.getToken().
  public async getWallet(tokenCode: string): Promise<GetTokenResponseDto> {
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}?includeBalances=true`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    return await this.httpService.get<GetTokenResponseDto>(url, headers);
  }

  public async getToken(tokenCode: string): Promise<GetTokenResultDto> {
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
      throw new Error(`GET TOKEN ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    // Put relevant stuff from getTokenResponseDto into a GetTokenResultDto and return
    // TODO: Test if this actually gets the properties from the response DTO as expected. I copy-pasted this from the old code and refactored a bit.
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
    const getTokenResultDto: GetTokenResultDto = {
      blocked: blocked,
      status: status,
      balance: balance,
    };

    return getTokenResultDto;
  }

  // Swagger docs https://service-integration.intersolve.nl/payment-instrument-payment/swagger/index.html
  public async getPhysicalCard(
    tokenCode: string,
  ): Promise<GetPhysicalCardReturnDto> {
    // TODO: Why was there no error checking in the old version of this code? Not in this function and neither in the only function that calls it. I added it, but mabe it was not there for good reason...?

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
      throw new Error(`GET PHYSICAL CARD ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    const getPhysicalCardReturnDto: GetPhysicalCardReturnDto = {
      status: getPhysicalCardResponseDto.data.data.status,
    };
    return getPhysicalCardReturnDto;
  }

  public async getTransactionInformation(
    tokenCode: string,
  ): Promise<GetTransactionInformationResultDto> {
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
    const getTransactionInformationResultDto: GetTransactionInformationResultDto =
      {
        spentThisMonth: spentThisMonth,
        lastTransactionDate: lastTransactionDate,
      };
    return getTransactionInformationResultDto;
  }

  // TODO: Make this function private once use of it in IntersolveVisaService is factored out.
  public async getTransactions({
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

    // TODO: Should we not put <GetTransactionsResponseDto> in .get instead of <any>?
    const getTransactionsResponseDto = await this.httpService.get<any>(
      url,
      headers,
    );
    // Handle the response

    const errorMessage = this.createErrorMessageIfRequestFailed(
      getTransactionsResponseDto,
    );
    // If the response contains errors
    if (errorMessage) {
      throw new Error(`GET TRANSACTIONS ERROR: ${errorMessage}`);
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
    // TODO: I am not sure this is how to create it, old code was pretty hard for me to understand. See (to be removed) this.linkCustomerToWallet()
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
      throw new Error(`REGISTER HOLDER ERROR: ${errorMessage}`);
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
    // TODO: I am not sure this is how to create it, old code was pretty hard for me to understand. See (to be removed) this.linkCustomerToWallet()
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
    const linkTokenResponse = await this.httpService.post<any>(
      url,
      linkTokenRequest,
      headers,
    );

    // Handle the response
    const errorMessage =
      this.createErrorMessageIfRequestFailed(linkTokenResponse);
    // If the response contains errors
    if (errorMessage) {
      throw new Error(`LINK TOKEN ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    // On success this returns a 204 No Content
    return;
  }

  public async createPhysicalCard(input: CreatePhysicalCardDto): Promise<void> {
    // Create the request body to send
    // TODO: As per new good practices: this request structure is not a DTO anymore, but created inline. Do the same for the request objects in all other methods in this class. Or should they be interfaces?
    const request = {
      brand: 'VISA_CARD',
      firstName: '',
      lastName: input.name,
      // TODO: We need to add a "+" for Intersolve's API to work. Do we have a generic helper function for this?
      mobileNumber: '+' + input.phoneNumber, // must match \"([+]){1}([1-9]){1}([0-9]){5,14}\"
      cardAddress: {
        address1:
          `${input.addressStreet} ${input.addressHouseNumber} ${input.addressHouseNumberAddition}`.trim(),
        city: input.addressCity,
        country: 'NLD',
        postalCode: input.addressPostalCode,
      },
      pinAddress: {
        address1:
          `${input.addressStreet} ${input.addressHouseNumber} ${input.addressHouseNumberAddition}`.trim(),
        city: input.addressCity,
        country: 'NLD',
        postalCode: input.addressPostalCode,
      },
      pinStatus: 'D',
      coverLetterCode: input.coverLetterCode,
    };

    // Send the request: https://service-integration.intersolve.nl/payment-instrument-payment/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const url = `${intersolveVisaApiUrl}/payment-instrument-payment/v1/tokens/${input.tokenCode}/create-physical-card`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    // On success this returns a 200 with a body containing correlationId
    // TODO: Replace <any> with something else, a DTO.
    const createPhysicalCardResponse = await this.httpService.post<any>(
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
      throw new Error(`CREATE PHYSICAL CARD ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    return;
  }

  public async transfer(transferDto: TransferDto): Promise<void> {
    // Create the request body to send

    const transferRequestDto: TransferRequestDto = {
      quantity: {
        value: transferDto.amount,
        assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE || 'EUR', // TODO: What do we want to do as pattern when an env variable is not defined as it should? Throw error? IMO defaulting to EUR is not what we want.
      },
      creditor: {
        tokenCode: transferDto.toTokenCode,
      },
      reference: transferDto.reference.slice(0, 128), // String of max 128 characters, does not need to be unique for every transfer. TODO: Asked Intersolve what the use case is of this field.
      operationReference: uuid(), // Required to pass in a UUID, which needs be unique for all transfers, or all transfers on a Token. TODO: Asked Intersolve what the use case is of this field.
    };

    // Send the request: https://service-integration.intersolve.nl/wallet/swagger/index.html
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'wallet-payments'
      : 'wallet';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${transferDto.fromTokenCode}/transfer`;
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
      throw new Error(`TRANSFER ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    return;
  }

  public async substituteToken(
    oldTokenCode: string,
    newTokenCode: string,
  ): Promise<void> {
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
    const substituteTokenResponse = await this.httpService.post(
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
      throw new Error(`SUBSTITUTE TOKEN ERROR: ${errorMessage}`);
    }

    // If the response does not contain errors
    return;
  }

  public async setTokenBlocked(
    tokenCode: string,
    blocked: boolean,
  ): Promise<BlockWalletResponseDto> {
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
        ? BlockWalletReasonCodeEnum.BLOCK_GENERAL
        : BlockWalletReasonCodeEnum.UNBLOCK_GENERAL,
    };
    const blockResult = await this.httpService.post<any>(url, payload, headers);

    // Handle the response
    // TODO: There is no value in returning these data fields: the caller does not do anything with them. Simply return (void).
    const result: BlockWalletResponseDto = {
      status: blockResult.status,
      statusText: blockResult.statusText,
      data: blockResult.data,
    };

    const errorMessage = this.createErrorMessageIfRequestFailed(blockResult);
    // If the response contains errors
    if (errorMessage) {
      throw new Error(`BLOCK TOKEN ERROR: ${errorMessage}`);
    }

    return result;
  }

  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
  public async updateCustomerPhoneNumber({
    holderId,
    phoneNumber,
  }: {
    holderId: string;
    phoneNumber: string;
  }): Promise<any> {
    // Create the request
    // TODO: Is there value in defining a DTO for the request format? (and any other request formats in this class for that matter?) See: CreateCustomerResponseExtensionDto
    const requestBody = {
      phoneNumbers: [
        {
          type: 'MOBILE',
          value: phoneNumber, // TODO: Do we need to format this phone number in some way?
        },
      ],
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
      throw new Error(`UPDATE PHONE NUMBER ERROR: ${errorMessage}`);
    }
  }

  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
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
    // TODO: Is there value in defining a DTO for the request format? (and any other request formats in this class for that matter?) See: createCustomerAddressPayload
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
      throw new Error(`UPDATE PHONE NUMBER ERROR: ${errorMessage}`);
    }

    return;
  }

  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
  // TODO: Remove this function, since it is not used (anymore)?
  public async activateWallet({
    tokenCode,
    payload,
  }: {
    tokenCode: string;
    payload: { reference: string };
  }): Promise<GetTokenResponseDto> {
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
    const url = `${intersolveVisaApiUrl}/${apiPath}/v1/tokens/${tokenCode}/activate`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    return await this.httpService.post<GetTokenResponseDto>(
      url,
      payload,
      headers,
    );
  }

  // Helper function to convert errors in an Intersolve API Response into a message string.
  // TODO: REFACTOR: Change this function to a private function once it is no longer used in the IntersolveVisaService.
  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
  public convertResponseErrorsToMessage(
    errorsInResponseDto: ErrorsInResponseDto[] | undefined,
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

  // TODO: REFACTOR: Can we accept anything other than any as input paramter? A "base response DTO" with status and optional errors? Still it could be undefined, since http.post returns undefined if the URL could not be found I think.
  // Funtion returns undefined if no error message could be created, which is when the request succeeded.
  private createErrorMessageIfRequestFailed(response: any): string | undefined {
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
}
