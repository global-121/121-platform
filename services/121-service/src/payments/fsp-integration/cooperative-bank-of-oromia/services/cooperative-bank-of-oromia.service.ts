import { Injectable } from '@nestjs/common';

import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.error';
import { CooperativeBankOfOromiaApiService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';

@Injectable()
export class CooperativeBankOfOromiaService {
  public constructor(private readonly cooperativeBankOfOromiaApiService: CooperativeBankOfOromiaApiService) {}

  public async attemptOrCheckDisbursement({
    cooperativeBankOfOromiaTransactionId,
    phoneNumber,
    amount,
  }: {
    cooperativeBankOfOromiaTransactionId: string;
    phoneNumber: string;
    amount: number;
  }): Promise<void> {
    const zambianCountryCode = '260';
    const phoneNumberWithoutCountryCode = phoneNumber.slice(
      zambianCountryCode.length,
    );

    if (phoneNumberWithoutCountryCode.length !== 9) {
      throw new CooperativeBankOfOromiaError(
        'does not have a valid phone number',
        CooperativeBankOfOromiaDisbursementResultEnum.fail,
      );
    }

    const { result, message } = await this.cooperativeBankOfOromiaApiService.disburse({
      cooperativeBankOfOromiaTransactionId,
      phoneNumberWithoutCountryCode,
      amount,
    });

    if (result === CooperativeBankOfOromiaDisbursementResultEnum.success) {
      return;
    }

    if (result === CooperativeBankOfOromiaDisbursementResultEnum.fail) {
      throw new CooperativeBankOfOromiaError(message, result);
    }

    if (result === CooperativeBankOfOromiaDisbursementResultEnum.ambiguous) {
      throw new CooperativeBankOfOromiaError(
        `Please use the CooperativeBankOfOromia Mobiquity portal to find out the status of the transaction. CooperativeBankOfOromia transaction id: ${cooperativeBankOfOromiaTransactionId} - Status: Ambiguous - (${message})`,
        result,
      );
    }

    if (result === CooperativeBankOfOromiaDisbursementResultEnum.duplicate) {
      const { result, message } = await this.cooperativeBankOfOromiaApiService.enquire({
        cooperativeBankOfOromiaTransactionId,
      });

      if (result === CooperativeBankOfOromiaDisbursementResultEnum.success) {
        return;
      }

      if (result === CooperativeBankOfOromiaDisbursementResultEnum.fail) {
        throw new CooperativeBankOfOromiaError(message, result);
      }
    }
  }
}
