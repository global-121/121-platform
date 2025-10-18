import { Injectable } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { ExcelTransactionJobDto } from '@121-service/src/transaction-queues/dto/excel-transaction-job.dto';

@Injectable()
export class TransactionJobsExcelService {
  constructor(
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async processExcelTransactionJob(
    transactionJob: ExcelTransactionJobDto,
  ): Promise<void> {
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };

    // Create transaction event 'initiated' or 'retry'
    await this.transactionJobsHelperService.createInitiatedOrRetryTransactionEvent(
      {
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      },
    );

    await this.transactionsService.saveTransactionProgress({
      context: transactionEventContext,
      newTransactionStatus: TransactionStatusEnum.waiting,
      description: TransactionEventDescription.excelPreparationForExport,
    });
  }
}
