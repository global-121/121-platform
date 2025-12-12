import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { CbeTransferScopedRepository } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia.scoped.repository';
import { CbeTransferEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-transfer.entity';
import { CommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';

@Injectable()
export class TransactionJobsCommercialBankEthiopiaService {
  constructor(
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionJobsHelperService: TransactionJobsHelperService,
    private readonly transactionsService: TransactionsService,
    private readonly programRepository: ProgramRepository,
    private readonly cbeTransferScopedRepository: CbeTransferScopedRepository,
  ) {}

  public async processCommercialBankEthiopiaTransactionJob(
    transactionJob: CommercialBankEthiopiaTransactionJobDto,
  ): Promise<void> {
    // Log transaction-job start: create 'initiated'/'retry' transaction event, set transaction to 'waiting' and update registration (if 'initiated')
    const transactionEventContext: TransactionEventCreationContext = {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    };
    await this.transactionJobsHelperService.logTransactionJobStart({
      context: transactionEventContext,
      isRetry: transactionJob.isRetry,
    });

    const credentials =
      await this.programFspConfigurationRepository.getUsernamePasswordProperties(
        transactionJob.programId,
      );

    // TODO: Performance would be better if we do this before the queue, but not sure if that is better from separation of concerns perspective
    const program = await this.programRepository.findOneOrFail({
      where: {
        id: Equal(transactionJob.programId),
      },
    });

    let debitTheirRef: string;
    if (transactionJob.isRetry) {
      const existingCbeTransfer =
        await this.cbeTransferScopedRepository.getExistingCbeTransferOrFail({
          transactionId: transactionJob.transactionId,
        });
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
            amount: transactionJob.transferValue,
          },
          credentials,
        },
      );

    await this.transactionsService.saveProgress({
      context: transactionEventContext,
      description:
        TransactionEventDescription.commercialBankEthiopiaRequestSent,
      errorMessage,
      newTransactionStatus: status,
    });

    const newCbeTransfer = new CbeTransferEntity();
    newCbeTransfer.debitTheirRef = debitTheirRef;
    newCbeTransfer.transactionId = transactionJob.transactionId;
    await this.cbeTransferScopedRepository.save(newCbeTransfer);
  }
}
