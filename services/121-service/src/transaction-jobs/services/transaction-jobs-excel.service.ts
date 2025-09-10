import { Injectable } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
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
    // Initial payment for Excel FSP is just storing a 'waiting' transaction
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );
    await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
      {
        registration,
        transactionJob,
        transferAmountInMajorUnit: transactionJob.transactionAmount,
        status: TransactionStatusEnum.waiting,
      },
    );
  }
}
