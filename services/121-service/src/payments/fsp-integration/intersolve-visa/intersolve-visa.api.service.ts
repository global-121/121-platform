import { CreateCustomerResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-customer-result.dto';
import { CreateCustomerDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-customer.dto';
import { CreatePhysicalCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-physical-card.dto';
import { GetPhysicalCardReturnDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-physical-card-return.dto';
import { GetTokenResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-token-result.dto';
import { GetTransactionInformationResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-transaction-information-result.dto';
import {
  AddressDto,
  CreateCustomerRequestDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-request.dto';
import {
  CreateCustomerResponseDto,
  CreateCustomerResponseExtensionDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-response.dto';
import { CreatePhysicalCardRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-physical-card-request.dto';
import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { GetPhysicalCardResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/get-physical-card-response.dto';
import { GetTokenResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/get-token-response.dto';
import { IssueTokenRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/issue-token-request.dto';
import { TransferRequestDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/transfer-request.dto';
import { TransferResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/transfer-response.dto';
import { IssueTokenResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/issue-token-result.dto';
import { IssueTokenDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/issue-token.dto';
import { TransferDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/transfer.dto';
import {
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-block.dto';
import { IssueTokenResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import {
  GetTransactionsResponseDto,
  IntersolveGetTransactionsResponseDataDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-transactions.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { formatPhoneNumber } from '@121-service/src/utils/phone-number.helpers';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    createCustomerDto: CreateCustomerDto,
  ): Promise<CreateCustomerResultDto> {
    // Create the request body to send
    const createCustomerRequestDto: CreateCustomerRequestDto = {
      externalReference: createCustomerDto.externalReference,
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
            country: 'NLD',
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

    // If the response contains errors
    if (!createCustomerResponseDto.data?.success) {
      // TODO: I do not understand the magic going on here behind the || part. If there are no errors, then what happens?
      const errorMessage = `CREATE CUSTOMER ERROR: ${
        this.convertResponseErrorsToMessage(
          createCustomerResponseDto.data?.errors,
        ) ||
        `${createCustomerResponseDto.status} - ${createCustomerResponseDto.statusText}`
      }`;
      throw new Error(errorMessage);
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
      reference: issueTokenDto.reference,
      activate: issueTokenDto.activate,
      // TODO: Can we just leave out quantities altogether from the request like this? Or does it need to be an empty array like it shows in the Integration Manual?
    };
    // Send the request
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

    // If the response contains errors
    if (!issueTokenResponseDto.data?.success) {
      // TODO: I do not understand the magic going on here behind the || part. If there are no errors, then what happens?
      const errorMessage = `ISSUE TOKEN ERROR: ${
        this.convertResponseErrorsToMessage(
          issueTokenResponseDto.data?.errors,
        ) ||
        `${issueTokenResponseDto.status} - ${issueTokenResponseDto.statusText}`
      }`;
      throw new Error(errorMessage);
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

    // If the response contains errors
    // TODO: Unlike in this.createCustomer(), this.issueToken() etc. we throw an HTTP 500 exception here instead of a "normal" error. I got this from refactoring (the old) intersolveVisaService.getUpdateWalletDetails().
    // I think this is because this function is also called from the cronjob to update wallet details as well as processing a transfer job. How to deal with this optimally? For simplicity, throw an HTTP 500 in every function,
    // which for processing transfer jobs is caught "higher up" (in the TransferService) and not re-thrown?
    // TODO: Then, nicely format what is sent in the error message, like in the other functions. Because that ends up in the transfer/transaction message. For the 500 in our logs, that message format should also be fine(?).
    if (!getTokenResponseDto.data?.success) {
      const errors =
        getTokenResponseDto.data?.errors ||
        'Intersolve-visa: Get wallet API-call failed';
      console.error(errors);
      throw new HttpException(
        {
          errors: errors,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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

    // If the response contains errors
    // TODO: Unlike in this.createCustomer(), this.issueToken() etc. we throw an HTTP 500 exception here instead of a "normal" error. I got this from refactoring (the old) intersolveVisaService.getUpdateWalletDetails().
    // I think this is because this function is also called from the cronjob to update wallet details as well as processing a transfer job. How to deal with this optimally? For simplicity, throw an HTTP 500 in every function,
    // which for processing transfer jobs is caught "higher up" (in the TransferService) and not re-thrown?
    // TODO: Then, nicely format what is sent in the error message, like in the other functions. Because that ends up in the transfer/transaction message. For the 500 in our logs, that message format should also be fine(?).
    if (!getPhysicalCardResponseDto.data?.success) {
      const errors =
        getPhysicalCardResponseDto.data?.errors ||
        'Intersolve-visa: Get physical card API-call failed';
      console.error(errors);
      throw new HttpException(
        {
          errors: errors,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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

    // If the response contains errors
    // TODO: Unlike in this.createCustomer(), this.issueToken() etc. we throw an HTTP 500 exception here instead of a "normal" error. I got this from refactoring (the old) intersolveVisaService.getUpdateWalletDetails().
    // I think this is because this function is also called from the cronjob to update wallet details as well as processing a transfer job. How to deal with this optimally? For simplicity, throw an HTTP 500 in every function,
    // which for processing transfer jobs is caught "higher up" (in the TransferService) and not re-thrown?
    // TODO: Then, nicely format what is sent in the error message, like in the other functions. Because that ends up in the transfer/transaction message. For the 500 in our logs, that message format should also be fine(?).
    if (!getTransactionsResponseDto.data?.success) {
      const error =
        getTransactionsResponseDto.data?.errors ||
        'Intersolve-visa: Get transactions API-call failed';
      console.error(error);
      throw new HttpException(
        {
          errors: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR, // This is 500 so that when this fails in a non-payment use case it will lead to an alert
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

    // If the response contains errors
    if (!this.isSuccessResponseStatus(registerHolderResponse.status)) {
      // TODO: I do not understand the magic going on here behind the || part. If there are no errors, then what happens?
      const errorMessage = `REGISTER HOLDER ERROR: ${
        this.convertResponseErrorsToMessage(
          registerHolderResponse.data?.errors,
        ) ||
        `${registerHolderResponse.status} - ${registerHolderResponse.statusText}`
      }`;
      throw new Error(errorMessage);
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

    let linkTokenResponse;
    // Send the request
    if (process.env.MOCK_INTERSOLVE) {
      // TODO: Implement Mock function:
      // linkTokenResponse = await this.intersolveVisaApiMockService.linkTokenMock();
    } else {
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
      linkTokenResponse = await this.httpService.post<any>(
        url,
        linkTokenRequest,
        headers,
      );
    }

    // Handle the response
    // If the response contains errors
    if (!this.isSuccessResponseStatus(linkTokenResponse.status)) {
      // TODO: I do not understand the magic going on here behind the || part. If there are no errors, then what happens?
      const errorMessage = `LINK TOKEN ERROR: ${
        this.convertResponseErrorsToMessage(linkTokenResponse.data?.errors) ||
        `${linkTokenResponse.status} - ${linkTokenResponse.statusText}`
      }`;
      throw new Error(errorMessage);
    }

    // If the response does not contain errors
    // On success this returns a 204 No Content
    return;
  }

  public async createPhysicalCard(
    createPhysicalCardDto: CreatePhysicalCardDto,
  ): Promise<void> {
    // Create the request body to send
    const createPhysicalCardRequestDto = new CreatePhysicalCardRequestDto();
    createPhysicalCardRequestDto.firstName = ''; // in 121 first name and last name are always combined into 1 "name" field, but Intersolve requires first name, so just give an empty string
    createPhysicalCardRequestDto.lastName = createPhysicalCardDto.name;
    createPhysicalCardRequestDto.mobileNumber = formatPhoneNumber(
      createPhysicalCardDto.phoneNumber,
    ); // TODO: Removed the check-for-null statement, since formatPhoneNumber already throws an error if the phone number is null
    createPhysicalCardRequestDto.cardAddress = {
      address1:
        `${createPhysicalCardDto.addressStreet} ${createPhysicalCardDto.addressHouseNumber} ${createPhysicalCardDto.addressHouseNumberAddition}`.trim(),
      city: createPhysicalCardDto.addressCity,
      country: 'NLD',
      postalCode: createPhysicalCardDto.addressPostalCode,
    };
    createPhysicalCardRequestDto.pinAddress = {
      address1:
        `${createPhysicalCardDto.addressStreet} ${createPhysicalCardDto.addressHouseNumber} ${createPhysicalCardDto.addressHouseNumberAddition}`.trim(),
      city: createPhysicalCardDto.addressCity,
      country: 'NLD',
      postalCode: createPhysicalCardDto.addressPostalCode,
    };
    createPhysicalCardRequestDto.pinStatus = 'D';

    // Send the request
    const authToken = await this.getAuthenticationToken();
    const url = `${intersolveVisaApiUrl}/payment-instrument-payment/v1/tokens/${createPhysicalCardDto.tokenCode}/create-physical-card`;
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];
    // On success this returns a 200 with a body containing correlationId
    // TODO: Replace <any> with something else, a DTO.
    const createPhysicalCardResponse = await this.httpService.post<any>(
      url,
      createPhysicalCardRequestDto,
      headers,
    );

    // Handle the response
    // If the response contains errors
    if (!this.isSuccessResponseStatus(createPhysicalCardResponse.status)) {
      // TODO: I do not understand the magic going on here behind the || part. If there are no errors, then what happens?
      const errorMessage = `CREATE PHYSICAL CARD ERROR: ${
        this.convertResponseErrorsToMessage(
          createPhysicalCardResponse.data?.errors,
        ) ||
        `${createPhysicalCardResponse.status} - ${createPhysicalCardResponse.statusText}`
      }`;
      throw new Error(errorMessage);
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
      // TODO: What to put in reference? In the Integration Manual it says "Budget Week 13" => Do the OCW and PV program teams see this text in their financial reports? If so, what do they want here? Check with Tijs.
      reference: '',
      operationReference: transferDto.operationReference,
    };

    // Send the request
    // TODO: If the IntersolveVisaApiMockService is removed, then also remove all these if (process.env.MOCK_INTERSOLVE) checks in all functions?
    const authToken = await this.getAuthenticationToken();
    const apiPath = process.env.INTERSOLVE_VISA_PROD
      ? 'pointofsale-payments'
      : 'pointofsale';
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
    // If the response contains errors
    if (!this.isSuccessResponseStatus(transferResponse.status)) {
      // TODO: I do not understand the magic going on here behind the || part. If there are no errors, then what happens?
      const errorMessage = `TRANSFER ERROR: ${
        this.convertResponseErrorsToMessage(transferResponse.data?.errors) ||
        `${transferResponse.status} - ${transferResponse.statusText}`
      }`;
      throw new Error(errorMessage);
    }
    // If the response does not contain errors
    return;
  }

  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
  public async toggleBlockWallet({
    tokenCode,
    payload,
    block,
  }: {
    tokenCode: string | null;
    payload: IntersolveBlockWalletDto;
    block: boolean;
  }): Promise<IntersolveBlockWalletResponseDto> {
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

  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
  public async updateCustomerPhoneNumber({
    holderId,
    payload,
  }: {
    holderId: string | null;
    payload: CreateCustomerResponseExtensionDto;
  }): Promise<any> {
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

  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
  public async updateCustomerAddress({
    holderId,
    payload,
  }: {
    holderId: string | null;
    payload: AddressDto;
  }): Promise<any> {
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

  // TODO: This function should throw an expection if the response contains errors, like the other (re-implemented) functions do.
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

  private getTwoMonthsAgo(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date;
  }
}
