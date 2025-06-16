import { Injectable } from '@nestjs/common';
import { constants, publicEncrypt } from 'crypto';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelApiError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel-api.error';
import { AirtelDisbursementScopedRepository } from '@121-service/src/payments/fsp-integration/airtel/repositories/airtel-disbursement.scoped.repository';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';

// ## TODO: when the branch for better handling of environment variables is merged, use that pattern.
const getEnvOrThrow = (envVar: string): string => {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(
      `Tried to get environment variable "${envVar}" but it is not set or is empty.`,
    );
  }
  return value;
};

@Injectable()
export class AirtelService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly airtelApiService: AirtelApiService,
    private readonly airtelDisbursementScopedRepository: AirtelDisbursementScopedRepository,
  ) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  private rsaPublicKeyToPem(key: string): string {
    const formattedKey = `-----BEGIN PUBLIC KEY-----\n${key
      .match(/.{1,64}/g)
      ?.join('\n')}\n-----END PUBLIC KEY-----`;
    return formattedKey;
  }

  private encryptPinV1(data: string, base64PublicKey: string): string {
    const publicKey = this.rsaPublicKeyToPem(base64PublicKey);
    const encrypted = publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(data),
    );
    return encrypted.toString('base64');
  }

  // ## TODO: rename

  public async attemptOrCheckDisbursement({
    airtelTransactionId,
    phoneNumber,
    currencyCode,
    countryCode,
    amount,
  }: {
    airtelTransactionId: string;
    phoneNumber: string;
    currencyCode: string;
    countryCode: string;
    amount: number;
  }) {
    // Encrypt the pin.
    const airtelDisbursementPin = getEnvOrThrow('AIRTEL_DISBURSEMENT_PIN');
    const airtelDisbursementV1PinEncryptionPublicKey = getEnvOrThrow(
      'AIRTEL_DISBURSEMENT_V1_PIN_ENCRYPTION_PUBLIC_KEY',
    );
    const encryptedPin = this.encryptPinV1(
      airtelDisbursementPin,
      airtelDisbursementV1PinEncryptionPublicKey,
    );

    // Validate phone number here, we want to *not* send requests when the phone number is invalid.
    const zambianCountryCode = '260';
    const phoneNumberWithoutCountryCode = phoneNumber.slice(
      zambianCountryCode.length,
    );

    if (!(phoneNumberWithoutCountryCode.length === 9)) {
      throw new AirtelError('does not have a valid phone number');
    }

    const { result, message } = await this.airtelApiService.disburse({
      airtelTransactionId,
      encryptedPin,
      phoneNumberWithoutCountryCode,
      currencyCode,
      countryCode,
      amount,
    });

    if (result === AirtelDisbursementResultEnum.success) {
      return;
    }

    if (result === AirtelDisbursementResultEnum.fail) {
      throw new AirtelApiError(message);
    }

    if (result === AirtelDisbursementResultEnum.duplicate) {
      const { result, message } = await this.airtelApiService.enquire({
        airtelTransactionId,
        countryCode,
        currencyCode,
      });

      if (result === AirtelDisbursementResultEnum.success) {
        return;
      }

      if (result === AirtelDisbursementResultEnum.fail) {
        throw new AirtelApiError(message);
      }
    }
  }
}
