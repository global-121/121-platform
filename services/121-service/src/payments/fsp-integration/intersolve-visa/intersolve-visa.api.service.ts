import { Injectable } from '@nestjs/common';
import { Issuer, TokenSet } from 'openid-client';
import { v4 as uuid } from 'uuid';

import { CreateCustomerRequestIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/create-customer-request-intersolve-api.dto';
import { CreateCustomerResponseIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/create-customer-response-intersolve-api.dto';
import { CreatePhysicalCardRequestIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/create-physical-card-request-intersolve-api.dto';
import { GetPhysicalCardResponseIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/get-physical-card-response-intersolve-api.dto';
import { GetTokenResponseIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/get-token-response-intersolve-api.dto';
import { GetTransactionsResponseIntersolveVisaDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/get-transactions-response-intersolve-api.dto';
import { IssueTokenRequestIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/issue-token-request-intersolve-api.dto';
import { IssueTokenResponseIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/issue-token-response-intersolve-api.dto';
import { BaseResponseIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/base-reponse-intersolve-api.dto';
import { ErrorsInResponseIntersolveApi } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';
import { SubstituteTokenRequestIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/substitute-token-request-intersolve-api.dto';
import { TransactionsIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/transactions-intersolve-api.dto';
import { TransferRequestIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/transfer-request-intersolve-api.dto';
import { TransferResponseIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/transfer-response-intersolve-api.dto';
import { IntersolveBlockTokenReasonCodeEnum } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-block-token-reason-code.enum';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { CreateCustomerReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/create-customer-return-type.interface';
import { GetPhysicalCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-physical-card-return-type.interface';
import { GetTokenReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-token-return-type.interface';
import { GetTransactionInformationReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-transaction-information-return-type.interface';
import { IssueTokenReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/issue-token-return-type.interface';
import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { formatPhoneNumber } from '@121-service/src/utils/phone-number.helpers';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

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
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly tokenValidationService: TokenValidationService,
  ) {}

  public async getAuthenticationToken() {
    if (process.env.MOCK_INTERSOLVE) {
      return 'mocked-token';
    }
    if (this.tokenValidationService.isTokenValid(this.tokenSet)) {
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
    if (tokenSet.expires_at) {
      tokenSet.expires_at *= 1000; // Convert to milliseconds to align with standards in tokenValidationService.isTokenValid()
    }
    // Cache tokenSet
    this.tokenSet = tokenSet;
    return tokenSet.access_token;
  }

  public async createCustomer({
    externalReference,
    name,
    contactInformation,
    estimatedAnnualPaymentVolumeMajorUnit,
  }: {
    externalReference: string;
    name: string;
    contactInformation: ContactInformation;
    estimatedAnnualPaymentVolumeMajorUnit: number;
  }): Promise<CreateCustomerReturnType> {
    // Create the request body to send
    const createCustomerRequestDto: CreateCustomerRequestIntersolveApiDto = {
      externalReference, // The IntersolveVisa does not "know about this", but we pass in the registration.referenceId here.
      individual: {
        firstName: '', // in 121 first name and last name are always combined into 1 "name" field, but Intersolve requires first name, so just give an empty string
        lastName: name,
        estimatedAnnualPaymentVolumeMajorUnit,
      },
      contactInfo: {
        addresses: [
          {
            type: 'HOME',
            addressLine1: this.createAddressString(contactInformation),
            city: contactInformation.addressCity,
            postalCode: contactInformation.addressPostalCode,
            country: 'NL',
          },
        ],
        phoneNumbers: [
          {
            type: 'MOBILE',
            value: formatPhoneNumber(contactInformation.phoneNumber),
          },
        ],
      },
    };

    // Send the request
    const createCustomerResponseDto =
      await this.intersolveApiRequest<CreateCustomerResponseIntersolveApiDto>({
        errorPrefix: IntersolveVisa121ErrorText.createCustomerError,
        method: 'POST',
        payload: createCustomerRequestDto,
        apiPath: 'customer',
        endpoint: 'customers/create-individual',
      });

    // If the response does not contain errors
    // Put relevant stuff from createCustomerResponseDto into a CreateCustomerResultDto and return
    const createCustomerResultDto: CreateCustomerReturnType = {
      holderId: createCustomerResponseDto.data.data.id,
    };
    return createCustomerResultDto;
  }

  public async issueToken({
    brandCode,
    activate,
    reference,
  }: {
    brandCode: string;
    activate: boolean;
    reference?: string;
  }): Promise<IssueTokenReturnType> {
    // Create the request body to send
    const issueTokenRequestDto: IssueTokenRequestIntersolveApiDto = {
      reference: reference ?? uuid(), // A UUID reference which can be used for "technical cancellation in case of time-out", which in accordance with Intersolve we do not implement.
      activate,
    };
    // Send the request: https://service-integration.intersolve.nl/pointofsale/swagger/index.html
    const issueTokenResponseDto =
      await this.intersolveApiRequest<IssueTokenResponseIntersolveApiDto>({
        errorPrefix: IntersolveVisa121ErrorText.issueTokenError,
        method: 'POST',
        payload: issueTokenRequestDto,
        apiPath: 'pointofsale',
        endpoint: `brand-types/${brandCode}/issue-token`,
      });

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
    const getTokenResponseDto =
      await this.intersolveApiRequest<GetTokenResponseIntersolveApiDto>({
        errorPrefix: IntersolveVisa121ErrorText.getTokenError,
        method: 'GET',
        apiPath: 'pointofsale',
        endpoint: `tokens/${tokenCode}?includeBalances=true`,
      });

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
      blocked,
      status,
      balance,
    };

    return getTokenResult;
  }

  // Swagger docs https://service-integration.intersolve.nl/payment-instrument-payment/swagger/index.html
  public async getPhysicalCard(
    tokenCode: string,
  ): Promise<GetPhysicalCardReturnType> {
    // Send the request
    const getPhysicalCardResponseDto =
      await this.intersolveApiRequest<GetPhysicalCardResponseIntersolveApiDto>({
        errorPrefix: IntersolveVisa121ErrorText.getPhysicalCardError,
        method: 'GET',
        apiPath: 'payment-instrument-payment',
        endpoint: `tokens/${tokenCode}/physical-card-data`,
      });

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
    let reservationTransactions: TransactionsIntersolveApiDto[] = [];
    let expiredTransactions: TransactionsIntersolveApiDto[] = [];
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
        spentThisMonth,
        lastTransactionDate,
      };
    return getTransactionInformationResultDto;
  }

  private async getTransactions({
    tokenCode,
    fromDate,
  }: {
    tokenCode: string;
    fromDate?: Date;
  }): Promise<GetTransactionsResponseIntersolveVisaDto> {
    // Send the request
    const getTransactionsResponseDto =
      await this.intersolveApiRequest<GetTransactionsResponseIntersolveVisaDto>(
        {
          errorPrefix: IntersolveVisa121ErrorText.getTransactionError,
          method: 'GET',
          apiPath: 'wallet',
          endpoint: `tokens/${tokenCode}/transactions${
            fromDate ? `?dateFrom=${fromDate.toISOString()}` : ''
          }`,
        },
      );

    return getTransactionsResponseDto;
  }

  private getLastTransactionDate(
    walletTransactions: TransactionsIntersolveApiDto[],
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
    walletTransactions: TransactionsIntersolveApiDto[];
    expiredReserveTransactions: TransactionsIntersolveApiDto[];
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
      holderId,
    };

    // Send the request
    await this.intersolveApiRequest<void>({
      errorPrefix: IntersolveVisa121ErrorText.registerHolderError,
      method: 'POST',
      payload: registerHolderRequest,
      apiPath: 'wallet',
      endpoint: `tokens/${tokenCode}/register-holder`,
    });
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
    await this.intersolveApiRequest<void>({
      errorPrefix: IntersolveVisa121ErrorText.linkTokenError,
      method: 'POST',
      payload: linkTokenRequest,
      apiPath: 'wallet',
      endpoint: `tokens/${parentTokenCode}/link-token`,
    });
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
    const request: CreatePhysicalCardRequestIntersolveApiDto = {
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
      coverLetterCode,
    };

    // Send the request: https://service-integration.intersolve.nl/payment-instrument-payment/swagger/index.html
    await this.intersolveApiRequest<void>({
      errorPrefix: IntersolveVisa121ErrorText.createPhysicalCardError,
      method: 'POST',
      payload: request,
      apiPath: 'payment-instrument-payment',
      endpoint: `tokens/${tokenCode}/create-physical-card`,
    });
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
    const amountInCent = Math.round(amountInMajorUnit * 100); // Math round is needed to prevent floating point errors

    const transferRequestDto: TransferRequestIntersolveApiDto = {
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
    await this.intersolveApiRequest<TransferResponseIntersolveApiDto>({
      errorPrefix: IntersolveVisa121ErrorText.transferError,
      method: 'POST',
      payload: transferRequestDto,
      apiPath: 'wallet',
      endpoint: `tokens/${fromTokenCode}/transfer`,
    });
  }

  public async substituteToken({
    oldTokenCode,
    newTokenCode,
  }: {
    oldTokenCode: string;
    newTokenCode: string;
  }): Promise<void> {
    // Create the request body to send

    const substituteTokenRequestDto: SubstituteTokenRequestIntersolveApiDto = {
      tokenCode: newTokenCode,
    };

    // Send the request: https://service-integration.intersolve.nl/wallet/swagger/index.html
    await this.intersolveApiRequest<TransferResponseIntersolveApiDto>({
      errorPrefix: IntersolveVisa121ErrorText.substituteTokenError,
      method: 'POST',
      payload: substituteTokenRequestDto,
      apiPath: 'wallet',
      endpoint: `tokens/${oldTokenCode}/substitute-token`,
    });
  }

  public async setTokenBlocked(
    tokenCode: string,
    blocked: boolean,
  ): Promise<void> {
    const payload = {
      reasonCode: blocked
        ? IntersolveBlockTokenReasonCodeEnum.BLOCK_GENERAL
        : IntersolveBlockTokenReasonCodeEnum.UNBLOCK_GENERAL,
    };

    await this.intersolveApiRequest<void>({
      errorPrefix: IntersolveVisa121ErrorText.blockTokenError,
      method: 'POST',
      payload,
      apiPath: 'pointofsale',
      endpoint: `tokens/${tokenCode}/${blocked ? 'block' : 'unblock'}`,
    });
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
    await this.intersolveApiRequest<void>({
      errorPrefix: IntersolveVisa121ErrorText.updatePhoneNumberError,
      method: 'PUT',
      payload: requestBody,
      apiPath: 'customer',
      endpoint: `customers/${holderId}/contact-info/phone-numbers`,
    });
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
    await this.intersolveApiRequest<void>({
      errorPrefix: IntersolveVisa121ErrorText.updateCustomerAddressError,
      method: 'PUT',
      payload: requestBody,
      apiPath: 'customer',
      endpoint: `customers/${holderId}/contact-info/addresses`,
    });
  }

  // Helper function to convert errors in an Intersolve API Response into a message string.
  private convertResponseErrorsToMessage(
    errorsInResponseDto: ErrorsInResponseIntersolveApi[] | undefined,
  ): string | undefined {
    if (
      !errorsInResponseDto ||
      !Array.isArray(errorsInResponseDto) ||
      !errorsInResponseDto.length
    ) {
      return undefined;
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

  private async intersolveApiRequest<
    ResponseDtoType extends BaseResponseIntersolveApiDto | void,
  >({
    errorPrefix,
    method,
    payload,
    endpoint,
    apiPath,
  }: {
    errorPrefix: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH';
    endpoint: string;
    apiPath:
      | 'customer'
      | 'pointofsale'
      | 'payment-instrument-payment'
      | 'wallet';
    payload?: unknown;
  }) {
    const authToken = await this.getAuthenticationToken();
    const headers = [
      { name: 'Authorization', value: `Bearer ${authToken}` },
      { name: 'Tenant-ID', value: process.env.INTERSOLVE_VISA_TENANT_ID },
    ];

    let intersolveVisaApiPath: string = apiPath;

    if (process.env.INTERSOLVE_VISA_PROD) {
      switch (apiPath) {
        case 'customer':
          intersolveVisaApiPath = 'customer-payments';
          break;
        case 'pointofsale':
          intersolveVisaApiPath = 'pointofsale-payments';
          break;
        case 'wallet':
          intersolveVisaApiPath = 'wallet-payments';
          break;
      }
    }

    const response = await this.httpService.request<ResponseDtoType>({
      method,
      url: `${intersolveVisaApiUrl}/${intersolveVisaApiPath}/v1/${endpoint}`,
      payload,
      headers,
    });

    const errorMessage = this.createErrorMessageIfRequestFailed(response);

    // If the response contains errors
    if (errorMessage) {
      throw new IntersolveVisaApiError(`${errorPrefix}: ${errorMessage}`);
    }

    return response;
  }

  private createErrorMessageIfRequestFailed<
    ResponseDtoType extends BaseResponseIntersolveApiDto | void,
  >(response: ResponseDtoType): string | undefined {
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
        this.convertResponseErrorsToMessage(response.data?.errors) ??
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
