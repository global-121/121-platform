import { Injectable } from '@nestjs/common';

import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { ExcelTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/excel-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';

@Injectable()
export class TransactionJobsExcelService {
  constructor(
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  public async processExcelTransactionJob(
    transactionJob: ExcelTransactionJobDto,
  ): Promise<void> {
    // Create 'initiated'/'retry' transaction event, set transaction to 'waiting' and update registration (if 'initiated')
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };
    await this.transactionJobsHelperService.saveTransactionProgress({
      context: transactionEventContext,
      description: transactionJob.isRetry
        ? TransactionEventDescription.retry
        : TransactionEventDescription.initiated,
      newTransactionStatus: TransactionStatusEnum.waiting,
    });

    // save transaction event and leave on 'waiting' (goes to final state only via reconciliation)
    await this.transactionJobsHelperService.saveTransactionProgress({
      context: transactionEventContext,
      description: TransactionEventDescription.excelPreparationForExport,
    });
  }
}
