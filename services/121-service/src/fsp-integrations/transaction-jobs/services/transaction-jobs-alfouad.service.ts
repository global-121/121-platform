import { Injectable } from '@nestjs/common';

import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.service';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { computeTransactionReference } from '@121-service/src/fsp-integrations/shared/helpers/generate-transaction-reference.helper';
import { TransactionJobService } from '@121-service/src/fsp-integrations/transaction-jobs/interfaces/transaction-job-service.interface';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { AlfouadTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/alfouad-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

@Injectable()
export class TransactionJobsAlfouadService
  implements TransactionJobService<AlfouadTransactionJobDto>
{
  public constructor(
    private readonly alfouadService: AlfouadService,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async processTransactionJob(
    transactionJob: AlfouadTransactionJobDto,
  ): Promise<void> {
    const context: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };

    await this.transactionJobsHelperService.logTransactionJobStart({
      context,
      isRetry: transactionJob.isRetry,
    });

    const referenceNumber = await this.generateReferenceNumber(transactionJob);
    const requestIdentity = await this.alfouadService.getAlfouadFspConfig({
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    });

    try {
      await this.alfouadService.createTransaction({
        senderFullName: transactionJob.senderFullName,
        senderPhoneNumber: transactionJob.senderPhoneNumber,
        beneficiaryFullName: transactionJob.beneficiaryFullName,
        beneficiaryPhoneNumber: transactionJob.beneficiaryPhoneNumber,
        referenceNumber,
        countryCode: transactionJob.countryCode,
        cityCode: transactionJob.cityCode,
        agentCode: transactionJob.agentCode,
        deliveryCurrencyCode: transactionJob.deliveryCurrencyCode,
        deliveryAmount: transactionJob.transferValue,
        requestIdentity,
      });
    } catch (error) {
      if (error instanceof AlfouadApiError) {
        await this.transactionsService.saveProgress({
          context,
          description: TransactionEventDescription.alfouadRequestSent,
          errorMessage: error.message,
          newTransactionStatus: TransactionStatusEnum.error,
        });
        return;
      }
      // Timeout / no response: leave the transaction on 'waiting' and let the job fail so it can be retried
      throw error;
    }

    await this.transactionsService.saveProgress({
      context,
      description: TransactionEventDescription.alfouadRequestSent,
    });
  }

  private async generateReferenceNumber(
    transactionJob: AlfouadTransactionJobDto,
  ): Promise<string> {
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionJob.transactionId,
      );

    return computeTransactionReference({
      referenceId: transactionJob.referenceId,
      transactionId: transactionJob.transactionId,
      failedTransactionAttempts,
    });
  }
}
