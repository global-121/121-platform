import { HttpStatus, Injectable } from '@nestjs/common';

import { env } from '@mock-service/src/env';
import { CooperativeBankOfOromiaAuthenticateRequestDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dto/cooperative-bank-of-oromia-authenticate-request.dto';
import { CooperativeBankOfOromiaAuthenticateResponseFailDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dto/cooperative-bank-of-oromia-authenticate-response-fail.dto';
import { CooperativeBankOfOromiaAuthenticateResponseSuccessDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dto/cooperative-bank-of-oromia-authenticate-response-success.dto';
import { CooperativeBankOfOromiaAuthenticatedRequestHeadersDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dto/cooperative-bank-of-oromia-authenticated-request-headers.dto';
import { CooperativeBankOfOromiaDisbursementV2RequestDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dto/cooperative-bank-of-oromia-disbursementv2-request.dto';

enum CooperativeBankOfOromiaMockPhoneNumber {
  failDuplicateTransactionId = '000000001',
  failInvalidMobileNumber = '000000002',
  failAmbiguousError = '000000003',
}

export const CooperativeBankOfOromiaAuthToken = 'FjE953LG40P0hdehYEiSkUd0hGWshyFf';

const getDecimalPlaces = (number: number): number => {
  const asString = number.toString();
  if (!asString.includes('.')) return 0;
  return asString.split('.')[1].length;
};

@Injectable()
export class CooperativeBankOfOromiaMockService {
  public async getAccessToken({
    headers,
    body,
  }: {
    headers: Record<string, string>;
    body: CooperativeBankOfOromiaAuthenticateRequestDto;
  }): Promise<
    CooperativeBankOfOromiaAuthenticateResponseFailDto | CooperativeBankOfOromiaAuthenticateResponseSuccessDto
  > {
    let error = false;

    // Using these headers with @nestjs/swagger''s @ApiHeader decorator is not (easily) possible, so we don't check them. We do want to check them in all other cases.
    const requestFromSwagger =
      headers?.origin === `http://localhost:${env.PORT_MOCK_SERVICE}`;
    if (!requestFromSwagger) {
      if (headers['content-type'] !== 'application/json') error = true;
    }
    if (body?.client_id === undefined) error = true;
    if (body.client_id === '') error = true;
    if (body?.client_secret === undefined) error = true;
    if (body.client_secret === '') error = true;
    if (body?.grant_type === undefined) error = true;
    if (body.grant_type !== 'client_credentials') error = true;

    let response;
    if (error) {
      // return a 400 error
      response = {
        error_description: 'Invalid client authentication',
        error: 'invalid_client',
      };
    } else {
      // An Oauth2 access/bearer token.
      response = {
        token_type: 'bearer',
        access_token: CooperativeBankOfOromiaAuthToken,
        expires_in: '180',
      };
    }
    return response;
  }

  public async disburseV2(
    transferDto: CooperativeBankOfOromiaDisbursementV2RequestDto,
    headers: CooperativeBankOfOromiaAuthenticatedRequestHeadersDto,
    // We use type "object" here because we have a bunch of different response bodies.
  ): Promise<[HttpStatus, object]> {
    // Pin encryption is not checked in this mock service. Because the encryption version used by cooperative-bank-of-oromia is not supported anymore by Node.js https://www.cvedetails.com/cve/CVE-2023-46809/.
    // So it was too much of a hassle to implement in mock mode. And not really worth it

    // FYI: header names are lower cased.

    // Using these headers with @nestjs/swagger''s @ApiHeader decorator is not (easily) possible, so we don't check them. We do want to check them in all other cases.
    const requestFromSwagger =
      headers?.origin === `http://localhost:${env.PORT_MOCK_SERVICE}`;
    if (!requestFromSwagger) {
      // 415 Unsupported Media Type
      if (headers['content-type'] !== 'application/json') return [415, {}];
    }

    // We accept Authorization headers under "Authorization" and
    // "Authorization_", but not both. See controller for why.
    if ('authorization' in headers && 'authorization_' in headers) {
      throw new Error(
        'Both "Authorization" and "Authorization_" headers are present.',
      );
    }
    if ('authorization_' in headers) {
      headers['authorization'] = headers['authorization_'];
      delete headers['authorization_'];
    }

    const authError: [HttpStatus, object] = [
      403,
      {
        error_description: 'The access token is invalid or has expired',
        error: 'invalid_token',
      },
    ];
    if (!headers['authorization']) return authError;
    if (headers['authorization'] !== `Bearer ${CooperativeBankOfOromiaAuthToken}`)
      return authError;

    // header: x-country
    const noXCountryHeader: [HttpStatus, object] = [
      400,
      {
        status_message: 'Partner 2d9647ada26843468f68e7090619d40b not found',
        status_code: 'ROUTER110',
      },
    ];
    if (!headers['x-country']) return noXCountryHeader;
    if (headers['x-country'] === '') return noXCountryHeader;

    const invalidCountryError: [HttpStatus, object] = [
      400,
      {
        status: {
          code: HttpStatus.BAD_REQUEST,
          message: 'Invalid Country Code',
          success: false,
          response_code: 'DP00900001013',
        },
      },
    ];
    if (headers['x-country'].length !== 2) return invalidCountryError;

    // header: x-currency
    const noXCurrencyHeader: [HttpStatus, object] = [
      200,
      {
        status: {
          code: HttpStatus.BAD_REQUEST,
          success: false,
          result_code: 'ESB000008',
          message:
            "Missing request header 'x-wallet-id' for method parameter of type String",
        },
      },
    ];
    if (!headers['x-currency']) return noXCurrencyHeader;

    const xCurrencyInvalidOrMissing: [HttpStatus, object] = [
      200,
      {
        status: {
          code: HttpStatus.BAD_REQUEST,
          message: 'Invalid/Missing Currency',
          response_code: 'DP00900001013',
          success: false,
        },
      },
    ];
    if (headers['x-currency'] === '') return xCurrencyInvalidOrMissing;

    // payee.msisdn (phone number)
    const invalidPhoneNumber: [HttpStatus, object] = [
      200,
      {
        status: {
          code: HttpStatus.BAD_REQUEST,
          message: 'Invalid Msisdn Length. Msisdn Length should be 9',
          response_code: 'DP00900001013',
          result_code: '521002',
          success: false,
        },
      },
    ];
    if (transferDto?.payee?.msisdn.length !== 9) {
      console.error('Got invalid phone number');
      return invalidPhoneNumber;
    }

    // transaction.amount
    const invalidAmount: [HttpStatus, object] = [
      200,
      {
        status: {
          code: HttpStatus.BAD_REQUEST,
          message:
            'Invalid Amount: The amount must not be null or blank, should contain only numeric characters, be greater than zero, and have a limited number of decimal places',
          response_code: 'DP00900001004',
          result_code: 'ESB000008',
          success: false,
        },
      },
    ];
    const amount = transferDto?.transaction?.amount;
    if (amount === undefined) return invalidAmount;
    // No need to check for "", we're going to do that correct on our end anyway.
    if (amount < 0) return invalidAmount;
    // Superfluous zeroes at end of number are not saved by JavaScript.
    // let a = 1.2000; // a = 1.2
    // So 1.2000 as amount will not trigger this error.
    const decimalPlaces = getDecimalPlaces(amount);
    if (decimalPlaces > 3) return invalidAmount;

    // pin
    const missingPin: [HttpStatus, object] = [
      200,
      {
        status: {
          code: HttpStatus.BAD_REQUEST,
          message: 'Missing header/body params',
          response_code: 'DP00900001013',
          success: false,
        },
      },
    ];
    const encryptedPin = transferDto?.pin;
    if (encryptedPin === undefined) return missingPin;

    const generateErrorResponse = ({
      message,
      response_code,
    }): [HttpStatus, object] => {
      return [
        200,
        {
          status: {
            code: HttpStatus.BAD_REQUEST,
            message,
            response_code,
            result_code: '521050',
            success: false,
          },
        },
      ];
    };

    if (
      CooperativeBankOfOromiaMockPhoneNumber.failDuplicateTransactionId ===
      transferDto.payee.msisdn
    ) {
      return generateErrorResponse({
        message: 'Duplicate exttRID',
        response_code: 'DP00900001011',
      });
    }

    if (
      CooperativeBankOfOromiaMockPhoneNumber.failInvalidMobileNumber === transferDto.payee.msisdn
    ) {
      return generateErrorResponse({
        message: 'Mobile number entered is incorrect.',
        response_code: 'DP00900001012',
      });
    }

    if (CooperativeBankOfOromiaMockPhoneNumber.failAmbiguousError === transferDto.payee.msisdn) {
      return generateErrorResponse({
        message:
          'The transaction is still processing and is in ambiguous state. Please do the transaction enquiry to fetch the transaction status.',
        response_code: 'DP00900001000',
      });
    }

    return this.generateSuccesResponseEnquiryV2DisbursementV2({
      transactionId: transferDto.transaction.id,
      currency: headers['x-currency'],
      phoneNumber: transferDto.payee.msisdn,
      amount: transferDto.transaction.amount,
    });
  }

  public async enquiryV2(
    {
      id,
      transactionType,
      headers,
    }: {
      id: string;
      transactionType: string;
      headers: CooperativeBankOfOromiaAuthenticatedRequestHeadersDto;
    },

    // We use type "object" here because we have a bunch of different response bodies.
  ): Promise<[HttpStatus, object]> {
    if (transactionType !== 'B2C') {
      throw new Error('Transaction type must be "B2C".');
    }

    return this.generateSuccesResponseEnquiryV2DisbursementV2({
      transactionId: id,
      currency: headers['x-currency'],
      phoneNumber: '000000001',
      amount: 1000.0,
    });
  }

  private generateSuccesResponseEnquiryV2DisbursementV2({
    transactionId,
    currency,
    phoneNumber,
    amount,
  }: {
    transactionId: string;
    currency: string;
    phoneNumber: string;
    amount?: number;
  }): [HttpStatus, object] {
    const amountString = amount.toFixed(2);
    return [
      200,
      {
        data: {
          transaction: {
            reference_id: 'CI250506.1824.H00006',
            airtel_money_id:
              'disbursement-Y79CTORHGI-wxBOCniOBPLNfBnUPCLIDW0i4m48AXmTWAyB4gN8',
            id: transactionId,
            status: 'TS',
          },
        },
        status: {
          response_code: 'DP00900001001',
          code: HttpStatus.OK,
          success: true,
          result_code: 'ESB000010',
          message: `You have sent ${currency} ${amountString} to ${phoneNumber} FirstName LastName. Bal ${currency} 19999.91.Com ${currency} 0 TID: CI250506.1824.H00006`,
        },
      },
    ];
  }
}
