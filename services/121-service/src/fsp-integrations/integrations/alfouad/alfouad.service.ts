import { Injectable } from '@nestjs/common';

import { AlfouadTransferStatus } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-transfer-status.enum';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-params.interface';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

@Injectable()
export class AlfouadService {
  public constructor(private readonly alfouadApiService: AlfouadApiService) {}

  public async createTransfer({
    alfouadReferenceId,
    amount,
    currency,
    externalId,
    phoneNumberPayment,
  }: CreateTransferParams): Promise<void> {
    await this.alfouadApiService.createTransfer({
      alfouadReferenceId,
      amount,
      currency,
      externalId,
      phoneNumber: phoneNumberPayment,
    });
  }

  public async getTransfer({
    alfouadReferenceId,
  }: {
    alfouadReferenceId: string;
  }): Promise<AlfouadTransferStatus> {
    return this.alfouadApiService.getTransfer({ alfouadReferenceId });
  }

  public mapAlfouadStatusToTransactionStatus({
    alfouadStatus,
  }: {
    alfouadStatus: AlfouadTransferStatus;
  }): TransactionStatusEnum {
    switch (alfouadStatus) {
      case AlfouadTransferStatus.successful:
        return TransactionStatusEnum.success;
      case AlfouadTransferStatus.pending:
        return TransactionStatusEnum.waiting;
      case AlfouadTransferStatus.failed:
        return TransactionStatusEnum.error;
      default:
        return TransactionStatusEnum.error;
    }
  }
}
