import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { MessageContentType } from '../../notifications/enum/message-type.enum';
import { MessageService } from '../../notifications/message.service';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';
import { RegistrationEntity } from '../../registration/registration.entity';
import { StatusEnum } from '../../shared/enum/status.enum';
import {
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '../dto/payment-transaction-result.dto';
import { LanguageEnum } from './../../registration/enum/language.enum';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
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
  private readonly financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(private readonly messageService: MessageService) {}

  public async getTransactions(
    programId: number,
    splitByTransactionStep: boolean,
    minPayment?: number,
    referenceId?: string,
  ): Promise<any> {
    const transactions =
      await this.getLatestAttemptPerPaAndPaymentTransactionsQuery(
        programId,
        splitByTransactionStep,
        minPayment,
        referenceId,
      ).getRawMany();
    return transactions;
  }

  public getLatestAttemptPerPaAndPaymentTransactionsQuery(
    programId: number,
    splitByTransactionStep: boolean,
    minPayment?: number,
    referenceId?: string,
  ): SelectQueryBuilder<any> {
    const maxAttemptPerPaAndPayment = this.transactionRepository
      .createQueryBuilder('transaction')
      .select(['payment', '"registrationId"'])
      .addSelect(
        `MAX(cast("transactionStep" as varchar) || '-' || cast(created as varchar)) AS max_attempt`,
      )
      .where('transaction.program.id = :programId', {
        programId: programId,
      })
      .groupBy('payment')
      .addGroupBy('"registrationId"');

    if (splitByTransactionStep) {
      maxAttemptPerPaAndPayment
        .addSelect('"transactionStep"')
        .addGroupBy('"transactionStep"');
    }
    let transactionQuery = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS "paymentDate"',
        'transaction.payment AS payment',
        '"referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as "errorMessage"',
        'transaction.customData as "customData"',
        'fsp.fspDisplayNamePortal as "fspName"',
        'fsp.fsp as "fsp"',
      ])
      .leftJoin('transaction.financialServiceProvider', 'fsp')
      .leftJoin(
        '(' + maxAttemptPerPaAndPayment.getQuery() + ')',
        'subquery',
        `transaction.registrationId = subquery."registrationId" AND transaction.payment = subquery.payment AND cast(transaction."transactionStep" as varchar) || '-' || cast(transaction.created as varchar) = subquery.max_attempt`,
      )
      .leftJoin('transaction.registration', 'r')
      .where('transaction.program.id = :programId', {
        programId: programId,
      })
      .andWhere('transaction.payment >= :minPayment', {
        minPayment: minPayment || 0,
      })
      .andWhere('subquery.max_attempt IS NOT NULL');
    if (referenceId) {
      transactionQuery = transactionQuery.andWhere(
        '"referenceId" = :referenceId',
        { referenceId: referenceId },
      );
    }
    return transactionQuery;
  }

  public async getTransaction(
    programId: number,
    input: GetTransactionDto,
  ): Promise<GetTransactionOutputDto> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: input.referenceId },
    });

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS "paymentDate"',
        'payment',
        '"referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as "errorMessage"',
        'transaction.customData as "customData"',
      ])
      .leftJoin('transaction.registration', 'c')
      .where('transaction.program.id = :programId', {
        programId: programId,
      })
      .andWhere('transaction.payment = :paymentId', {
        paymentId: input.payment,
      })
      .andWhere('transaction.registration.id = :registrationId', {
        registrationId: registration.id,
      })
      .orderBy('transaction.created', 'DESC')
      .getRawMany();
    if (transactions.length === 0) {
      return null;
    }
    if (input.customDataKey) {
      for (const transaction of transactions) {
        if (
          transaction.customData[input.customDataKey] === input.customDataValue
        ) {
          return transaction;
        }
      }
      return null;
    }
    for (const transaction of transactions) {
      if (
        !transaction.customData ||
        Object.keys(transaction.customData).length === 0
      ) {
        return transaction;
      }
    }
  }

  public async storeTransactionUpdateStatus(
    transactionResponse: PaTransactionResultDto,
    programId: number,
    payment: number,
    transactionStep?: number,
  ): Promise<TransactionEntity> {
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { fsp: transactionResponse.fspName },
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
    transaction.transactionStep = transactionStep || 1;

    const resultTransaction = await this.transactionRepository.save(
      transaction,
    );

    if (program.enableMaxPayments && registration.maxPayments) {
      await this.checkAndUpdateMaxPaymentRegistration(registration);
    }

    if (
      transactionResponse.status === StatusEnum.success &&
      fsp.notifyOnTransaction &&
      transactionResponse.notificationObjects &&
      transactionResponse.notificationObjects.length > 0
    ) {
      // loop over notification objects and send a message for each

      for (const transactionNotifcation of transactionResponse.notificationObjects) {
        const message = this.getMessageText(
          registration.preferredLanguage,
          program.notifications,
          transactionNotifcation,
        );
        await this.messageService.sendTextMessage(
          registration,
          program.id,
          message,
          null,
          false,
          MessageContentType.payment,
        );
      }
    }
    return resultTransaction;
  }

  private getMessageText(
    language: LanguageEnum,
    programNotifications: object,
    transactionNotification: TransactionNotificationObject,
  ): string {
    const key = transactionNotification.notificationKey;
    let message =
      programNotifications[language]?.[key] ||
      programNotifications[this.fallbackLanguage][key];
    if (transactionNotification.dynamicContent.length > 0) {
      for (const [
        i,
        dynamicContent,
      ] of transactionNotification.dynamicContent.entries()) {
        const replaceString = `{{${i + 1}}}`;
        if (message.includes(replaceString)) {
          message = message.replace(replaceString, dynamicContent);
        }
      }
    }
    return message;
  }

  private async checkAndUpdateMaxPaymentRegistration(
    registration: RegistrationEntity,
  ): Promise<void> {
    // Get current amount of payments done to PA
    const { currentPaymentCount } = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT payment)', 'currentPaymentCount')
      .leftJoin('transaction.registration', 'r')
      .where('transaction.program.id = :programId', {
        programId: registration.programId,
      })
      .andWhere('r.id = :registrationId', {
        registrationId: registration.id,
      })
      .getRawOne();
    // Match that against registration.maxPayments
    if (
      currentPaymentCount >= registration.maxPayments &&
      registration.registrationStatus === RegistrationStatusEnum.included
    ) {
      registration.registrationStatus = RegistrationStatusEnum.completed;
      await this.registrationRepository.save(registration);
    }
  }

  public async storeAllTransactions(
    transactionResults: any,
    programId: number,
    payment: number,
  ): Promise<void> {
    // Intersolve transactions are now stored during PA-request-loop already
    // Align across FSPs in future again
    for (const transaction of transactionResults.paList) {
      await this.storeTransactionUpdateStatus(transaction, programId, payment);
    }
  }
}
