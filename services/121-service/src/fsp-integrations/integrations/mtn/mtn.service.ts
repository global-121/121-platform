import { Injectable } from '@nestjs/common';

import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/create-transfer-params.interface';
import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';
import { MtnTransferStatusResponse } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-transfer-status-response.interface';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

@Injectable()
export class MtnService {
  public constructor(private readonly mtnApiService: MtnApiService) {}

  // This ensures:
  //   a. Payment retry: a new mtnReferenceId is generated (different failedTransactionAttempts count), which will not be blocked by MTN API, as desired.
  //   b. Queue retry: the same mtnReferenceId is generated (same failedTransactionAttempts count), which will be blocked by MTN API as duplicate, as desired.
  public generateMtnReferenceId({
    referenceId,
    transactionId,
    failedTransactionAttempts,
  }: {
    referenceId: string;
    transactionId: number;
    failedTransactionAttempts: number;
  }): string {
    return generateUUIDFromSeed(
      `ReferenceId=${referenceId},TransactionId=${transactionId},Attempt=${failedTransactionAttempts}`,
    );
  }

  public async createTransfer({
    mtnReferenceId,
    amount,
    currency,
    externalId,
    phoneNumber,
    transactionId,
    requestIdentity,
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
      requestIdentity,
    });
    console.log(
      `[MTN Transfer] Successfully initiated - referenceId: ${mtnReferenceId}`,
    );
  }

  public async getTransferStatus({
    mtnReferenceId,
    requestIdentity,
  }: {
    mtnReferenceId: string;
    requestIdentity: MtnRequestIdentity;
  }): Promise<MtnTransferStatusResponse> {
    console.log(
      `[MTN Transfer] Fetching status - referenceId: ${mtnReferenceId}`,
    );
    const status = await this.mtnApiService.getTransferStatus({
      referenceId: mtnReferenceId,
      requestIdentity,
    });
    console.log(
      `[MTN Transfer] Status retrieved - referenceId: ${mtnReferenceId}, status: ${status.status}`,
    );
    return status;
  }

  public mapMtnStatusToTransactionStatus({
    mtnStatus,
  }: {
    mtnStatus: MtnTransferStatus;
  }): TransactionStatusEnum {
    switch (mtnStatus) {
      case MtnTransferStatus.successful:
        return TransactionStatusEnum.success;
      case MtnTransferStatus.pending:
        return TransactionStatusEnum.waiting;
      case MtnTransferStatus.failed:
        return TransactionStatusEnum.error;
      default:
        return TransactionStatusEnum.error;
    }
  }
}
