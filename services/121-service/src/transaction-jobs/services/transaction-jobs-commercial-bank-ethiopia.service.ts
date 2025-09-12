import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { CbeTransferScopedRepository } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.scoped.repository';
import { CbeTransferEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-transfer.entity';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';

@Injectable()
export class TransactionJobsCommercialBankEthiopiaService {
  constructor(
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly programRepository: ProgramRepository,
    private readonly cbeTransferScopedRepository: CbeTransferScopedRepository,
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
      const existingCbeTransfer =
        await this.cbeTransferScopedRepository.getExistingCbeTransferOrFail(
          transactionJob.paymentId,
          registration.id,
        );
      debitTheirRef = existingCbeTransfer.debitTheirRef;
    } else {
      debitTheirRef = transactionJob.debitTheirRef as string;
    }

    const { status, errorMessage } =
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

    const transaction =
      await this.transactionJobsHelperService.createTransactionAndUpdateRegistration(
        {
          registration,
          transactionJob,
          transferAmountInMajorUnit: transactionJob.transactionAmount,
          status,
          errorText: errorMessage,
        },
      );
    // TODO: combine this with the transaction creation above in one SQL transaction
    const newCbeTransfer = new CbeTransferEntity();
    newCbeTransfer.debitTheirRef = debitTheirRef;
    newCbeTransfer.transactionId = transaction.id;
    await this.cbeTransferScopedRepository.save(newCbeTransfer);
  }
}
