import { Injectable } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SaveTransactionProgressAndRelatedDataContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-related-data-context.interface';
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
    const transactionEventContext: SaveTransactionProgressAndRelatedDataContext =
      {
        transactionId: transactionJob.transactionId,
        userId: transactionJob.userId,
        programFspConfigurationId: transactionJob.programFspConfigurationId,
        programId: transactionJob.programId,
        referenceId: transactionJob.referenceId,
        isRetry: transactionJob.isRetry,
      };

    // Create transaction event 'initiated' or 'retry'
    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    await this.transactionJobsHelperService.saveTransactionProgressAndUpdateRelatedData(
      {
        context: transactionEventContext,
        newTransactionStatus: TransactionStatusEnum.waiting,
        description: TransactionEventDescription.excelPreparationForExport,
      },
    );
  }
}
