import { Injectable } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { SaveTransactionProgressAndUpdateRegistrationContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-update-registration-context.interface';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { ExcelTransactionJobDto } from '@121-service/src/transaction-queues/dto/excel-transaction-job.dto';

@Injectable()
export class TransactionJobsExcelService {
  constructor(
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processExcelTransactionJob(
    transactionJob: ExcelTransactionJobDto,
  ): Promise<void> {
    // Create transaction event 'initiated' or 'retry'
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };

    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    // save transaction progress
    const saveTransactionProgressAndUpdateRegistrationContext: SaveTransactionProgressAndUpdateRegistrationContext =
      {
        transactionEventContext,
        programId: transactionJob.programId,
        referenceId: transactionJob.referenceId,
        isRetry: transactionJob.isRetry,
      };
    await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRegistration(
      {
        context: saveTransactionProgressAndUpdateRegistrationContext,
        newTransactionStatus: TransactionStatusEnum.waiting,
        description: TransactionEventDescription.excelPreparationForExport,
      },
    );
  }
}
