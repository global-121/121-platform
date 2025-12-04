import { Injectable } from '@nestjs/common';

import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/fsp-integrations/api-integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaError } from '@121-service/src/fsp-integrations/api-integrations/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.error';
import { CooperativeBankOfOromiaApiService } from '@121-service/src/fsp-integrations/api-integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';

@Injectable()
export class CooperativeBankOfOromiaService {
  public constructor(
    private readonly cooperativeBankOfOromiaApiService: CooperativeBankOfOromiaApiService,
  ) {}

  public async initiateTransfer({
    cooperativeBankOfOromiaMessageId,
    recipientCreditAccountNumber,
    debitAccountNumber,
    amount,
  }: {
    cooperativeBankOfOromiaMessageId: string;
    debitAccountNumber: string;
    recipientCreditAccountNumber: string;
    amount: number;
  }): Promise<void> {
    const { result, message } =
      await this.cooperativeBankOfOromiaApiService.initiateTransfer({
        cooperativeBankOfOromiaMessageId,
        recipientCreditAccountNumber,
        debitAccountNumber,
        amount,
      });

    if (result === CooperativeBankOfOromiaTransferResultEnum.success) {
      return;
    }

    if (result === CooperativeBankOfOromiaTransferResultEnum.fail) {
      throw new CooperativeBankOfOromiaError(result, message);
    }
  }
}
