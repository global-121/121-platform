import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaTransactionResultDto } from '../../fsp/dto/payment-transaction-result.dto';
import {
  FinancialServiceProviderEntity,
  FspName,
} from '../../fsp/financial-service-provider.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { TransactionEntity } from './transaction.entity';

@Injectable()
export class TransactionsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  public constructor() {}

  public async storeTransaction(
    transactionResponse: PaTransactionResultDto,
    programId: number,
    payment: number,
    fspName: FspName,
  ): Promise<void> {
    const program = await this.programRepository.findOne(programId);
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { fsp: fspName },
    });
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: transactionResponse.referenceId },
    });

    const transaction = new TransactionEntity();
    transaction.amount = transactionResponse.calculatedAmount;
    transaction.created = transactionResponse.date || new Date();
    transaction.registration = registration;
    transaction.financialServiceProvider = fsp;
    transaction.program = program;
    transaction.payment = payment;
    transaction.status = transactionResponse.status;
    transaction.errorMessage = transactionResponse.message;
    transaction.customData = transactionResponse.customData;
    transaction.transactionStep = 1;

    this.transactionRepository.save(transaction);
  }

  public async storeAllTransactions(
    transactionResults: any,
    programId: number,
    payment: number,
  ): Promise<void> {
    // Intersolve transactions are now stored during PA-request-loop already
    // Align across FSPs in future again
    for (let transaction of transactionResults.africasTalkingTransactionResult
      .paList) {
      await this.storeTransaction(
        transaction,
        programId,
        payment,
        FspName.africasTalking,
      );
    }
  }
}
