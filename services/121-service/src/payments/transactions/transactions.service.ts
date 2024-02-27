import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FinancialServiceProviderEntity } from '../../financial-service-providers/financial-service-provider.entity';
import { MessageContentType } from '../../notifications/enum/message-type.enum';
import { MessageProcessTypeExtension } from '../../notifications/message-job.dto';
import { MessageTemplateService } from '../../notifications/message-template/message-template.service';
import { QueueMessageService } from '../../notifications/queue-message/queue-message.service';
import { TwilioMessageEntity } from '../../notifications/twilio.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '../../registration/registration-scoped.repository';
import { RegistrationEntity } from '../../registration/registration.entity';
import { ScopedQueryBuilder, ScopedRepository } from '../../scoped.repository';
import { StatusEnum } from '../../shared/enum/status.enum';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import {
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '../dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '../dto/transaction-relation-details.dto';
import { LanguageEnum } from './../../registration/enum/language.enum';
import {
  AuditedTransactionReturnDto,
  TransactionReturnDto,
} from './dto/get-transaction.dto';
import { LatestTransactionEntity } from './latest-transaction.entity';
import { TransactionEntity } from './transaction.entity';

@Injectable()
export class TransactionsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(LatestTransactionEntity)
  private readonly latestTransactionRepository: Repository<LatestTransactionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly queueMessageService: QueueMessageService,
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  public async getAuditedTransactions(
    programId: number,
    payment?: number,
    referenceId?: string,
  ): Promise<AuditedTransactionReturnDto[]> {
    const query = this.getLastTransactionsQuery(programId, payment, referenceId)
      .leftJoin('transaction.user', 'user')
      .addSelect('user.id', 'userId')
      .addSelect('user.username', 'username');
    const rawResult = await query.getRawMany();
    const result = rawResult.map((row) => {
      const { userId, username, ...rest } = row;
      return {
        ...rest,
        user: {
          id: userId,
          username,
        },
      };
    });
    return result;
  }

  public async getLastTransactions(
    programId: number,
    payment?: number,
    referenceId?: string,
    status?: StatusEnum,
  ): Promise<TransactionReturnDto[]> {
    return this.getLastTransactionsQuery(
      programId,
      payment,
      referenceId,
      status,
    ).getRawMany();
  }

  public getLastTransactionsQuery(
    programId: number,
    payment?: number,
    referenceId?: string,
    status?: StatusEnum,
  ): ScopedQueryBuilder<TransactionEntity> {
    let transactionQuery = this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS "paymentDate"',
        'transaction.payment AS payment',
        'r."referenceId"',
        'status',
        'amount',
        'transaction.errorMessage as "errorMessage"',
        'transaction.customData as "customData"',
        'fsp.nameDisplayNamePortal as "fspName"',
        'fsp.name as "fsp"',
        'fsp.integrationType as "fspIntegrationType"',
      ])
      .leftJoin('transaction.financialServiceProvider', 'fsp')
      .leftJoin('transaction.registration', 'r')
      .innerJoin('transaction.latestTransaction', 'lt')
      .andWhere('transaction."programId" = :programId', {
        programId: programId,
      });
    if (payment) {
      transactionQuery = transactionQuery.andWhere(
        'transaction.payment = :payment',
        { payment: payment },
      );
    }
    if (referenceId) {
      transactionQuery = transactionQuery.andWhere(
        'r."referenceId" = :referenceId',
        { referenceId: referenceId },
      );
    }
    if (status) {
      transactionQuery = transactionQuery.andWhere(
        'transaction.status = :status',
        { status: status },
      );
    }
    return transactionQuery;
  }

  public async storeTransactionUpdateStatus(
    transactionResponse: PaTransactionResultDto,
    relationDetails: TransactionRelationDetailsDto,
    transactionStep?: number,
  ): Promise<TransactionEntity> {
    const program = await this.programRepository.findOneBy({
      id: relationDetails.programId,
    });
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { name: transactionResponse.fspName },
    });
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: transactionResponse.referenceId },
    });

    const transaction = new TransactionEntity();
    transaction.amount = transactionResponse.calculatedAmount;
    transaction.created = transactionResponse.date || new Date();
    transaction.registration = registration;
    transaction.financialServiceProvider = fsp;
    transaction.program = program;
    transaction.payment = relationDetails.paymentNr;
    transaction.userId = relationDetails.userId;
    transaction.status = transactionResponse.status;
    transaction.errorMessage = transactionResponse.message;
    transaction.customData = transactionResponse.customData;
    transaction.transactionStep = transactionStep || 1;

    const resultTransaction =
      await this.transactionScopedRepository.save(transaction);

    if (transactionResponse.messageSid) {
      await this.twilioMessageRepository.update(
        { sid: transactionResponse.messageSid },
        {
          transactionId: resultTransaction.id,
        },
      );
    }

    await this.updatePaymentCountRegistration(
      registration,
      program.enableMaxPayments,
    );
    await this.updateLatestTransaction(transaction);
    if (
      transactionResponse.status === StatusEnum.success &&
      fsp.notifyOnTransaction &&
      transactionResponse.notificationObjects &&
      transactionResponse.notificationObjects.length > 0
    ) {
      // loop over notification objects and send a message for each
      for (const transactionNotification of transactionResponse.notificationObjects) {
        const message = await this.getMessageText(
          registration.preferredLanguage,
          program.id,
          transactionNotification,
        );
        await this.queueMessageService.addMessageToQueue(
          registration,
          message,
          null,
          MessageContentType.payment,
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
          null,
          null,
          transactionNotification.bulkSize,
        );
      }
    }
    return resultTransaction;
  }

  private async getMessageText(
    language: LanguageEnum,
    programId: number,
    transactionNotification: TransactionNotificationObject,
  ): Promise<string> {
    const key = transactionNotification.notificationKey;
    const messageTemplates =
      await this.messageTemplateService.getMessageTemplatesByProgramId(
        programId,
        key,
      );

    const notification = messageTemplates.find(
      (template) => template.language === language,
    );
    const fallbackNotification = messageTemplates.find(
      (template) => template.language === this.fallbackLanguage,
    );
    let message = notification
      ? notification.message
      : fallbackNotification.message;

    if (transactionNotification.dynamicContent.length > 0) {
      for (const [
        i,
        dynamicContent,
      ] of transactionNotification.dynamicContent.entries()) {
        const replaceString = `[[${i + 1}]]`;
        if (message.includes(replaceString)) {
          message = message.replace(replaceString, dynamicContent);
        }
      }
    }
    return message;
  }

  private async updateLatestTransaction(
    transaction: TransactionEntity,
  ): Promise<void> {
    const latestTransaction = new LatestTransactionEntity();
    latestTransaction.registrationId = transaction.registrationId;
    latestTransaction.payment = transaction.payment;
    latestTransaction.transactionId = transaction.id;
    try {
      // Try to insert a new LatestTransactionEntity
      await this.latestTransactionRepository.insert(latestTransaction);
    } catch (error) {
      if (error.code === '23505') {
        // 23505 is the code for unique violation in PostgreSQL
        // If a unique constraint violation occurred, update the existing LatestTransactionEntity
        await this.latestTransactionRepository.update(
          {
            registrationId: latestTransaction.registrationId,
            payment: latestTransaction.payment,
          },
          latestTransaction,
        );
      } else {
        // If some other error occurred, rethrow it
        throw error;
      }
    }
  }

  private async updatePaymentCountRegistration(
    registration: RegistrationEntity,
    enableMaxPayments: boolean,
  ): Promise<void> {
    // Get current amount of payments done to PA
    const { currentPaymentCount } = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT payment)', 'currentPaymentCount')
      .leftJoin('transaction.registration', 'r')
      .andWhere('transaction.program.id = :programId', {
        programId: registration.programId,
      })
      .andWhere('r.id = :registrationId', {
        registrationId: registration.id,
      })
      .getRawOne();
    // Match that against registration.maxPayments
    // If a program has a maxPayments set, and the currentPaymentCount is equal or larger to that, set registrationStatus to completed if it is currently included
    if (
      enableMaxPayments &&
      registration.maxPayments &&
      currentPaymentCount >= registration.maxPayments &&
      registration.registrationStatus === RegistrationStatusEnum.included
    ) {
      registration.registrationStatus = RegistrationStatusEnum.completed;
      await this.registrationScopedRepository.save(registration);
    }
    // After .save() because it otherwise overwrites with old paymentCount
    await this.registrationScopedRepository.updateUnscoped(registration.id, {
      paymentCount: currentPaymentCount,
    });
  }

  public async storeAllTransactions(
    transactionResults: { paList: PaTransactionResultDto[] },
    transactionRelationDetails: TransactionRelationDetailsDto,
  ): Promise<void> {
    // Intersolve transactions are now stored during PA-request-loop already
    // Align across FSPs in future again
    for (const transaction of transactionResults.paList) {
      await this.storeTransactionUpdateStatus(
        transaction,
        transactionRelationDetails,
      );
    }
  }

  public async storeAllTransactionsBulk(
    transactionResults: PaTransactionResultDto[],
    transactionRelationDetails: TransactionRelationDetailsDto,
    transactionStep?: number,
  ): Promise<void> {
    // NOTE: this method is currently only used for the import-fsp-reconciliation use case and assumes:
    // 1: only 1 FSP
    // 2: no notifications to send
    // 3: no payment count to update (as it is reconciliation of existing payment)
    // 4: no twilio message to relate to
    // 5: registrationId to be known in transactionResults
    const program = await this.programRepository.findOneBy({
      id: transactionRelationDetails.programId,
    });
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { name: transactionResults[0].fspName },
    });

    const transactionsToSave = transactionResults.map(
      (transactionResponse) => ({
        amount: transactionResponse.calculatedAmount,
        registrationId: transactionResponse.registrationId,
        financialServiceProvider: fsp,
        program: program,
        payment: transactionRelationDetails.paymentNr,
        userId: transactionRelationDetails.userId,
        status: transactionResponse.status,
        errorMessage: transactionResponse.message,
        customData: transactionResponse.customData,
        transactionStep: transactionStep || 1,
      }),
    );

    const savedTransactions = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .insert()
      .into(TransactionEntity)
      .values(transactionsToSave)
      .execute();
    const savedTransactionEntities =
      await this.transactionScopedRepository.find({
        where: {
          id: In(savedTransactions.identifiers.map((i) => i.id)),
        },
      });

    // Leaving this per transaction for now, as it is not a performance bottleneck
    for (const transaction of savedTransactionEntities) {
      await this.updateLatestTransaction(transaction);
    }
  }

  public async updateWaitingTransaction(
    payment: number,
    regisrationId: number,
    status: StatusEnum,
    transactionStep: number,
    messageSid?: string,
    errorMessage?: string,
  ): Promise<void> {
    const foundTransaction = await this.transactionScopedRepository.findOne({
      where: {
        payment,
        registrationId: regisrationId,
        transactionStep,
        status: StatusEnum.waiting,
      },
    });
    if (foundTransaction) {
      if (status === StatusEnum.waiting && messageSid) {
        await this.twilioMessageRepository.update(
          { sid: messageSid },
          {
            transactionId: foundTransaction.id,
          },
        );
      }
      if (status === StatusEnum.error) {
        foundTransaction.status = status;
        foundTransaction.errorMessage = errorMessage;
        await this.transactionScopedRepository.save(foundTransaction);
      }
    }
  }
}
