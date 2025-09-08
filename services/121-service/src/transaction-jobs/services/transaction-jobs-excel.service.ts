import { Injectable } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { ExcelTransactionJobDto } from '@121-service/src/transaction-queues/dto/excel-transaction-job.dto';

@Injectable()
export class TransactionJobsExcelService {
  constructor(
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
  ) {}

  // ##TODO: unit-test this method
  public async processExcelTransactionJob(
    transactionJob: ExcelTransactionJobDto,
  ): Promise<void> {
    console.log('transactionJob: ', transactionJob);
    // const transactionResultObjectList: {
    //   paTransactionResultDto: PaTransactionResultDto;
    //   transactionRelationDetailsDto: TransactionRelationDetailsDto;
    // }[] = [];

    // const paTransactionResultDto = new PaTransactionResultDto();
    // paTransactionResultDto.calculatedAmount = transactionJob.transactionAmount;
    // paTransactionResultDto.fspName = Fsps.excel;
    // paTransactionResultDto.referenceId = transactionJob.referenceId;
    // paTransactionResultDto.status = TransactionStatusEnum.waiting;

    // const transactionRelationDetailsDto = {
    //   programId: transactionJob.programId,
    //   paymentId: transactionJob.paymentId,
    //   userId: transactionJob.userId,
    //   programFspConfigurationId: transactionJob.programFspConfigurationId,
    // };

    // const transactionResultObject = {
    //   paTransactionResultDto,
    //   transactionRelationDetailsDto,
    // };

    // transactionResultObjectList.push(transactionResultObject);

    // await this.transactionsService.storeAllTransactions(
    //   transactionResultObjectList,
    // );
    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );
    await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
      {
        registration,
        transactionJob,
        transferAmountInMajorUnit: transactionJob.transactionAmount,
        status: TransactionStatusEnum.waiting, // This will only go to 'success' via callback
      },
    );

    // ##TODO no return is relevant any more like before. Check consequences.
    // const fspTransactionResult = new FspTransactionResultDto();
    // fspTransactionResult.fspName = Fsps.excel;
    // fspTransactionResult.paList = transactionResultObjectList.map(
    //   (transactionResultObject) =>
    //     transactionResultObject.paTransactionResultDto,
    // );
    // return fspTransactionResult;
  }
}
