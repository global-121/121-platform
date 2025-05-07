import { HttpStatus, Injectable } from '@nestjs/common';
import { constants, privateDecrypt } from 'crypto';

import {
  AirtelAuthenticateBodyDto,
  AirtelAuthenticateResponseBodyFailDto,
  AirtelAuthenticateResponseBodySuccessDto,
  AirtelDisbursementV1PayloadDto,
} from '@mock-service/src/fsp-integration/airtel/airtel.dto';

export const AirtelAuthToken = 'FjE953LG40P0hdehYEiSkUd0hGWshyFf';
// PIN we use during testing.
const PIN_TESTING = '1234';
// A keypair we use during testing.
const _pinEncryptionV1PublicKey =
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4Fqi/qpxIJMwtqrHS1KdKucZtKB2+Qn5H5U77TEnv7MPSQBY13DTGnuxP7DGCVf2GXgC/8g5VC8uage3wzzEkd1KN8UJqBil1U01qksqTFip6hJHvgdb/gBSH+HJOipF64UFrxs4ygoYL4wQJpbIC4LHxBEIxwuzrJKm0jSQhdwIDAQAB';
const pinEncryptionV1PrivateKey =
  'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBALgWqL+qnEgkzC2qsdLUp0q5xm0oHb5CfkflTvtMSe/sw9JAFjXcNMae7E/sMYJV/YZeAL/yDlULy5qB7fDPMSR3Uo3xQmoGKXVTTWqSypMWKnqEke+B1v+AFIf4ck6KkXrhQWvGzjKChgvjBAmlsgLgsfEEQjHC7OskqbSNJCF3AgMBAAECgYAaGbxbUIlQAUehwe3sgpIlmil0GJf+/daBwxVrs+lXxy4MhWGgyVQCRU4kFsz+Ocr0XielD2DQ1hdMFNfzqKzCzQVEQVJN/py/UQUJA2YQz7FpkJNFKQqF1LfGbcuHO3Og2h9EtUaTcTKqG/UpikCHGWgxY2yLT8HCZAWq2mpw4QJBAO4u8TXnMFTPOvlmybUFDhv2c3EV5ecKpMCS3vU5CLrQXXTt9AoP0MxZItPT4D94+dRzU7tVrB3vbMzkAr1aqOsCQQDF29XbBisCt2ftHxstzcdhgwIP718c9Lg4duJGSHPLRHe9puxQ/EutaVICiPGK+TDjRNGkOnhNPVoJhukFT0alAkAilZZYqVUPO3fottAbBLzjuolQpklXnugFPk45dSqbVZ38WIDS5TEAOwEfmOg6zyoXexdxYCM5xYYayhDLxdo5AkAm1j/j/hHzNozvvmtXUk0QluaQuiuxQ1flvXAs24vfGlFmqJ06SEuSflnapYbEAKXX9mowEkoK30ANHq4enLEBAkEA5Mp/stBE4m2CZKAzWbOy4R6fFWD3XEaINkSI5vWvB4JZOINeZZP6yq9HlbvQsyd9OZz7WhMhX1IOy9jlndQEJQ==';

const rsaPrivateKeyToPem = (key: string): string => {
  const formattedKey = `-----BEGIN PRIVATE KEY-----\n${key
    .match(/.{1,64}/g)
    ?.join('\n')}\n-----END PRIVATE KEY-----`;
  return formattedKey;
};

const decryptPinV1 = (encryptedPin: string, privateKey: string): string => {
  const privateKeyPem = rsaPrivateKeyToPem(privateKey);
  const bufferCiphertext = Buffer.from(encryptedPin, 'base64');
  const decrypted = privateDecrypt(
    {
      key: privateKeyPem,
      padding: constants.RSA_PKCS1_PADDING,
    },
    bufferCiphertext,
  );
  return decrypted.toString('utf8');
};

const getDecimalPlaces = (number: number): number => {
  const asString = number.toString();
  if (!asString.includes('.')) return 0;
  return asString.split('.')[1].length;
};

@Injectable()
export class AirtelMockService {
  public async getAccessToken(
    body: AirtelAuthenticateBodyDto,
  ): Promise<
    | AirtelAuthenticateResponseBodyFailDto
    | AirtelAuthenticateResponseBodySuccessDto
  > {
    let error = false;
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
        access_token: AirtelAuthToken,
        expires_in: 180,
      };
    }
    return response;
  }

  public async transfer(
    transferDto: AirtelDisbursementV1PayloadDto,
    headers: Record<string, string>,
    // We use type "object" here because we have a bunch of different response bodies.
  ): Promise<[HttpStatus, object]> {
    // FYI: header names are lower cased.

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
    if (headers['authorization'] !== `Bearer ${AirtelAuthToken}`)
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
          code: '400',
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
          code: '400',
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
          code: '400',
          message: 'Invalid/Missing Currency',
          success: false,
          response_code: 'DP00900001013',
        },
      },
    ];
    if (headers['x-currency'] === '') return xCurrencyInvalidOrMissing;

    // payee.msisdn (phone number)
    const invalidPhoneNumber: [HttpStatus, object] = [
      200,
      {
        status: {
          response_code: 'DP00900001013',
          code: '400',
          success: false,
          result_code: '521002',
          message: 'Invalid Msisdn Length. Msisdn Length should be 9',
        },
      },
    ];
    if (transferDto?.payee?.msisdn.length !== 9) return invalidPhoneNumber;

    // transaction.amount
    const invalidAmount: [HttpStatus, object] = [
      200,
      {
        status: {
          response_code: 'DP00900001004',
          code: '400',
          success: false,
          result_code: 'ESB000008',
          message:
            'Invalid Amount: The amount must not be null or blank, should contain only numeric characters, be greater than zero, and have a limited number of decimal places',
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
          code: '400',
          message: 'Missing header/body params',
          success: false,
          response_code: 'DP00900001013',
        },
      },
    ];
    const encryptedPin = transferDto?.pin;
    if (encryptedPin === undefined) return missingPin;

    const invalidPin: [HttpStatus, object] = [
      200,
      {
        status: {
          code: '400',
          message: 'Incorrect Encrypted Pin',
          success: false,
          response_code: 'DP00900001013',
        },
      },
    ];
    // We allow a hardcoded value for making testing through Swagger easier.
    let pinWasCorrectlyEncrypted = false;
    if (encryptedPin === 'not-really-encrypted') {
      pinWasCorrectlyEncrypted = true;
    } else {
      // Does not work because "RSA_PKCS1_PADDING is no longer supported for
      // private decryption" which is because of
      // https://www.cvedetails.com/cve/CVE-2023-46809/ If we really want to
      // decrypt using RSA_PKCS1_PADDING we'll need to create a workaround.
      try {
        // We use hardcoded PIN_TESTING and pinEncryptionV1PrivateKey for testing.
        const decryptedPin = decryptPinV1(
          encryptedPin,
          pinEncryptionV1PrivateKey,
        );
        pinWasCorrectlyEncrypted = decryptedPin === PIN_TESTING;
      } catch (e) {
        // do nothing
        console.error('Error decrypting pin', e);
      }
    }
    if (!pinWasCorrectlyEncrypted) return invalidPin;

    const amountString = amount.toFixed(2);
    return [
      200,
      {
        data: {
          transaction: {
            reference_id: 'CI250506.1824.H00006',
            airtel_money_id:
              'disbursement-Y79CTORHGI-wxBOCniOBPLNfBnUPCLIDW0i4m48AXmTWAyB4gN8',
            id: 'wxBOCniOBPLNfBnUPCLIDW0i4m48AXmTWAyB4gN8',
            status: 'TS',
          },
        },
        status: {
          response_code: 'DP00900001001',
          code: '200',
          success: true,
          result_code: 'ESB000010',
          message: `You have sent ${headers['x-currency']} ${amountString} to ${transferDto.payee.msisdn} FirstName LastName. Bal ZMW 19999.91.Com ZMW 0 TID: CI250506.1824.H00006`,
        },
      },
    ];
  }
}
