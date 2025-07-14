import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';

@Injectable()
export class AirtelService implements FspIntegrationInterface {
  public constructor(private readonly airtelApiService: AirtelApiService) {}

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
    amount,
  }: {
    airtelTransactionId: string;
    phoneNumber: string;
    amount: number;
  }): Promise<void> {
    const zambianCountryCode = '260';
    const phoneNumberWithoutCountryCode = phoneNumber.slice(
      zambianCountryCode.length,
    );

    if (phoneNumberWithoutCountryCode.length !== 9) {
      throw new AirtelError(
        'does not have a valid phone number',
        AirtelDisbursementResultEnum.fail,
      );
    }

    const { result, message } = await this.airtelApiService.disburse({
      airtelTransactionId,
      phoneNumberWithoutCountryCode,
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
        `Please use the Airtel Mobiquity portal to find out the status of the transaction. Airtel transaction id: ${airtelTransactionId} - Status: Ambiguous - (${message})`,
        result,
      );
    }

    if (result === AirtelDisbursementResultEnum.duplicate) {
      const { result, message } = await this.airtelApiService.enquire({
        airtelTransactionId,
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
