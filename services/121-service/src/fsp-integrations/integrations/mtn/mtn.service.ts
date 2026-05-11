import { Injectable } from '@nestjs/common';

import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/create-transfer-params.interface';
import { MtnTransferStatusResponse } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-transfer-status-response.interface';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

@Injectable()
export class MtnService {
  public constructor(private readonly mtnApiService: MtnApiService) {}

  public async createTransfer({
    mtnReferenceId,
    amount,
    currency,
    externalId,
    phoneNumber,
    transactionId,
  }: CreateTransferParams): Promise<void> {
    const message = `Payment for transaction ${transactionId}`;
    console.log(
      `[MTN Transfer] Initiating transfer - referenceId: ${mtnReferenceId}, externalId: ${externalId}, amount: ${amount} ${currency}, phoneNumber: ${phoneNumber}`,
    );
    await this.mtnApiService.createTransfer({
      mtnReferenceId,
      amount,
      currency,
      externalId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber,
      },
      payerMessage: message,
      payeeNote: message,
    });
    console.log(
      `[MTN Transfer] Successfully initiated - referenceId: ${mtnReferenceId}`,
    );
  }

  public async getTransferStatus({
    mtnReferenceId,
  }: {
    mtnReferenceId: string;
  }): Promise<MtnTransferStatusResponse> {
    console.log(
      `[MTN Transfer] Fetching status - referenceId: ${mtnReferenceId}`,
    );
    const status = await this.mtnApiService.getTransferStatus({
      referenceId: mtnReferenceId,
    });
    console.log(
      `[MTN Transfer] Status retrieved - referenceId: ${mtnReferenceId}, status: ${status.status}`,
    );
    return status;
  }

  public mapMtnStatusToTransactionStatus({
    mtnStatus,
  }: {
    mtnStatus: string;
  }): TransactionStatusEnum {
    switch (mtnStatus) {
      case 'SUCCESSFUL':
        return TransactionStatusEnum.success;
      case 'PENDING':
        return TransactionStatusEnum.waiting;
      case 'FAILED':
        return TransactionStatusEnum.error;
      default:
        return TransactionStatusEnum.error;
    }
  }
}
