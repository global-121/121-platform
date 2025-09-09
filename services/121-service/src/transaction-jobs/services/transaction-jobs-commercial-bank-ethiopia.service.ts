import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { CreditTransferApiParams } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';

@Injectable()
export class TransactionJobsCommercialBankEthiopiaService {
  constructor(
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly programRepository: ProgramRepository,
  ) {}

  public async processCommercialBankEthiopiaTransactionJob(
    transactionJob: CommercialBankEthiopiaTransactionJobDto,
  ): Promise<void> {
    const credentials =
      await this.programFspConfigurationRepository.getUsernamePasswordProperties(
        transactionJob.programId,
      );

    const registration =
      await this.transactionJobsHelperService.getRegistrationOrThrow(
        transactionJob.referenceId,
      );

    // TODO: Performance would be better if we do this before the queue, but not sure if that is better from seperation of concerns perspective
    const program = await this.programRepository.findOneOrFail({
      where: {
        id: Equal(transactionJob.programId),
      },
    });

    let debitTheirRef: string;
    if (transactionJob.isRetry) {
      const existingTransaction =
        await this.transactionScopedRepository.findOneOrFail({
          where: {
            paymentId: Equal(transactionJob.paymentId),
            registrationId: Equal(registration.id),
          },
          order: {
            created: 'DESC',
          },
        });
      const requestResult = existingTransaction.customData
        ?.requestResult as CreditTransferApiParams; // TODO: Create a commercial bank of ethiopia request entity to store this data in instead of transaction.customData
      debitTheirRef = requestResult?.debitTheirRef;
    } else {
      debitTheirRef = transactionJob.debitTheirRef as string;
    }

    const { status, errorMessage, customData } =
      await this.commercialBankEthiopiaService.createCreditTransferOrGetTransactionStatus(
        {
          inputParams: {
            debitTheirRef,
            bankAccountNumber: transactionJob.bankAccountNumber,
            ngoName: program.ngo,
            titlePortal: program.titlePortal,
            currency: program.currency, // TODO: This could have been hardcoded but for now leaving this as it was before this refactor
            fullName: transactionJob.fullName,
            amount: transactionJob.transactionAmount,
          },
          credentials,
        },
      );
    await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
      {
        registration,
        transactionJob,
        transferAmountInMajorUnit: transactionJob.transactionAmount,
        status,
        errorText: errorMessage,
        customData,
      },
    );
  }
}
