import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { MtnMockReferenceId } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-mock-reference-id.enum';
import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/create-transfer-params.interface';
import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';
import { MtnTransferStatusResponse } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-transfer-status-response.interface';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
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
    const seededMtnReferenceId = generateUUIDFromSeed(
      `ReferenceId=${referenceId},TransactionId=${transactionId},Attempt=${failedTransactionAttempts}`,
    );

    if (env.MTN_MODE !== FspMode.mock) {
      return seededMtnReferenceId;
    }

    // Mock-mode only: if the registration's referenceId is one of the
    // `MtnMockReferenceId` UUIDs, pass it through unchanged instead of seeding
    // a new UUID. This is required because the mock's `getTransfer`
    // endpoint receives *only* the referenceId — it has no access to the
    // phone number or any other field — so the failure scenario must be
    // encoded in the referenceId itself for the mock to route on it.
    // Having mock related code here in the 121-service is sub-optimal however
    // since GET getTransfer only accepts a referenceId which is generated here
    // there is no good alternative.
    const mtnMockReferenceIds = Object.values(MtnMockReferenceId) as string[];
    if (mtnMockReferenceIds.includes(referenceId)) {
      return referenceId;
    }
    return seededMtnReferenceId;
  }

  public async createTransfer({
    mtnReferenceId,
    amount,
    currency,
    externalId,
    phoneNumberPayment,
    transactionId,
    requestIdentity,
  }: CreateTransferParams): Promise<void> {
    const message = `Payment for transaction ${transactionId}`;
    console.log(
      `[MTN Transfer] Initiating transfer - referenceId: ${mtnReferenceId}, externalId: ${externalId}, amount: ${amount} ${currency}, phoneNumberPayment: ${phoneNumberPayment}`,
    );
    await this.mtnApiService.createTransfer({
      mtnReferenceId,
      amount,
      currency,
      externalId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: phoneNumberPayment,
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
