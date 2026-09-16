import { Injectable } from '@nestjs/common';

import { AlFouadApiError } from '@121-service/src/fsp-integrations/integrations/al-fouad/errors/al-fouad-api.error';
import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.service';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

@Injectable()
export class AlFouadReconciliationService {
  public constructor(
    private readonly alFouadService: AlFouadService,
    private readonly transactionsService: TransactionsService,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async doAlFouadReconciliation(): Promise<number> {
    const transactionIds =
      await this.transactionRepository.getWaitingTransactionIdsByFsp({
        fspName: Fsps.alFouad,
      });

    for (const transactionId of transactionIds) {
      try {
        await this.reconcileTransaction(transactionId);
      } catch (error) {
        if (!(error instanceof AlFouadApiError)) {
          throw error;
        }

        console.error(
          `Al Fouad reconciliation failed for transaction ${transactionId}:`,
          error.message,
        );
      }
    }

    return transactionIds.length;
  }

  private async reconcileTransaction(transactionId: number): Promise<void> {
    const referenceNumber = await this.recomputeReferenceNumber(transactionId);
    const authIdentity = await this.getAuthIdentity(transactionId);

    const transactionState = await this.alFouadService.getTransactionStateByRef({
      referenceNumber,
      authIdentity,
    });

    if (!transactionState) {
      throw new AlFouadApiError({
        message: `Al Fouad transaction not found for referenceNumber ${referenceNumber}`,
      });
    }

    const finalTransactionStatus =
      this.alFouadService.mapAlFouadStateToFinalTransactionStatus({
        alFouadState: transactionState,
      });

    if (!finalTransactionStatus) {
      return;
    }

    await this.transactionsService.saveProgressFromExternalSource({
      transactionId,
      description: TransactionEventDescription.alFouadReconciliationProcessed,
      newTransactionStatus: finalTransactionStatus.newTransactionStatus,
      errorMessage: finalTransactionStatus.errorMessage,
    });
  }

  private async recomputeReferenceNumber(
    transactionId: number,
  ): Promise<string> {
    const referenceId =
      await this.transactionRepository.getReferenceIdByTransactionIdOrThrow(
        transactionId,
      );

    return this.alFouadService.generateReferenceNumber({
      referenceId,
      transactionId,
    });
  }

  private async getAuthIdentity(
    transactionId: number,
  ): Promise<AlFouadAuthIdentity> {
    const latestEvent =
      await this.transactionEventScopedRepository.findLatestEventByTransactionId(
        transactionId,
      );

    const { authIdentity } = await this.alFouadService.getAlFouadFspConfig({
      programFspConfigurationId: latestEvent.programFspConfigurationId,
    });

    return authIdentity;
  }
}
