import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { AirtelEncryptionService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.encryption.service';
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
  private readonly airtelDisbursementPin: string;
  private readonly airtelDisbursementV1PinEncryptionPublicKey: string;

  public constructor(
    private readonly airtelApiService: AirtelApiService,
    private readonly airtelEncryptionService: AirtelEncryptionService,
  ) {
    this.airtelDisbursementPin = getEnvOrThrow('AIRTEL_DISBURSEMENT_PIN');
    this.airtelDisbursementV1PinEncryptionPublicKey = getEnvOrThrow(
      'AIRTEL_DISBURSEMENT_V1_PIN_ENCRYPTION_PUBLIC_KEY',
    );
  }

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
    const encryptedPin = this.airtelEncryptionService.encryptPinV1(
      this.airtelDisbursementPin,
      this.airtelDisbursementV1PinEncryptionPublicKey,
    );

    // Validate phone number here, we want to *not* send requests when the phone number is invalid.
    const zambianCountryCode = '260';
    const phoneNumberWithoutCountryCode = phoneNumber.slice(
      zambianCountryCode.length,
    );

    if (!(phoneNumberWithoutCountryCode.length === 9)) {
      throw new AirtelError(
        'does not have a valid phone number',
        AirtelDisbursementResultEnum.fail,
      );
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
      throw new AirtelError(message, result);
    }

    if (result === AirtelDisbursementResultEnum.ambiguous) {
      throw new AirtelError(
        `The transaction is in an ambiguous state. Please use the Airtel Mobiquity portal to find out the status of the transaction. Airtel transaction id: ${airtelTransactionId}`,
        result,
      );
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
        throw new AirtelError(message, result);
      }
    }
  }
}
