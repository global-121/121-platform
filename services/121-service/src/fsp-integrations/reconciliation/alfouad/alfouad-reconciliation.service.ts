import { Injectable } from '@nestjs/common';

import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.service';
import { mapAlfouadStateToTransactionStatus } from '@121-service/src/fsp-integrations/integrations/alfouad/helpers/map-alfouad-state-to-transaction-status.helper';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { computeTransactionReference } from '@121-service/src/fsp-integrations/shared/helpers/generate-transaction-reference.helper';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

@Injectable()
export class AlfouadReconciliationService {
  public constructor(
    private readonly alfouadService: AlfouadService,
    private readonly transactionsService: TransactionsService,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async doAlfouadReconciliation(): Promise<number> {
    const transactionIds =
      await this.transactionRepository.getWaitingTransactionIdsByFsp({
        fspName: Fsps.alfouad,
        limit: 1000,
      });

    for (const transactionId of transactionIds) {
      // Isolate per-transaction failures so a single unreconcilable transaction does not halt the batch.
      try {
        await this.reconcileTransaction(transactionId);
      } catch (error) {
        console.error(
          `Al Fouad reconciliation failed for transaction ${transactionId}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    return transactionIds.length;
  }

  private async reconcileTransaction(transactionId: number): Promise<void> {
    const referenceNumber = await this.recomputeReferenceNumber(transactionId);
    const requestIdentity = await this.getRequestIdentity(transactionId);

    const transactionState = await this.alfouadService.getTransactionStateByRef({
      referenceNumber,
      requestIdentity,
    });

    if (!transactionState) {
      throw new Error(
        `Al Fouad transaction not found for referenceNumber ${referenceNumber}`,
      );
    }

    const newTransactionStatus = mapAlfouadStateToTransactionStatus({
      alfouadState: transactionState,
    });

    // Pending / Approved / Hold: leave the transaction on 'waiting'.
    if (newTransactionStatus === TransactionStatusEnum.waiting) {
      return;
    }

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId,
      description: TransactionEventDescription.alfouadReconciliationProcessed,
      newTransactionStatus,
      errorMessage:
        newTransactionStatus === TransactionStatusEnum.error
          ? 'The transaction was canceled at Al Fouad.'
          : undefined,
    });
  }

  private async recomputeReferenceNumber(
    transactionId: number,
  ): Promise<string> {
    const referenceId =
      await this.transactionRepository.getReferenceIdByTransactionIdOrThrow(
        transactionId,
      );

    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionId,
      );

    return computeTransactionReference({
      referenceId,
      transactionId,
      failedTransactionAttempts,
    });
  }

  private async getRequestIdentity(
    transactionId: number,
  ): Promise<AlfouadRequestIdentity> {
    const latestEvent =
      await this.transactionEventScopedRepository.findLatestEventByTransactionId(
        transactionId,
      );

    return this.alfouadService.getAlfouadFspConfig({
      programFspConfigurationId: latestEvent.programFspConfigurationId,
    });
  }
}
