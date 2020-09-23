import { AfricasTalkingService } from './africas-talking.service';
import { IntersolveService } from './intersolve.service';
import { IntersolveApiService } from './api/instersolve.api.service';
import { StatusEnum } from './../../shared/enum/status.enum';
import { StatusMessageDto } from '../../shared/dto/status-message.dto';
import { Injectable } from '@nestjs/common';
import {
  fspName,
  FinancialServiceProviderEntity,
} from './financial-service-provider.entity';
import { FspCallLogEntity } from './fsp-call-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { ProgramEntity } from '../program/program.entity';
import { TransactionEntity } from '../program/transactions.entity';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { FspPaymentResultDto } from './dto/fsp-payment-results.dto';
import { AfricasTalkingNotificationEntity } from './africastalking-notification.entity';
import { DEBUG } from '../../config';

@Injectable()
export class FspService {
  @InjectRepository(FspCallLogEntity)
  public fspCallLogRepository: Repository<FspCallLogEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(AfricasTalkingNotificationEntity)
  public africasTalkingNotificationRepository: Repository<
    AfricasTalkingNotificationEntity
  >;

  public constructor(
    private readonly africasTalkingService: AfricasTalkingService,
    private readonly intersolveService: IntersolveService,
    private readonly intersolveApiService: IntersolveApiService,
  ) {}

  public async createSendPaymentListFsp(
    fsp: FinancialServiceProviderEntity,
    includedConnections: ConnectionEntity[],
    amount: number,
    program: ProgramEntity,
    installment: number,
  ): Promise<FspPaymentResultDto> {
    const details = await this.createPaymentDetails(
      includedConnections,
      amount,
      fsp.id,
    );
    let paymentResult;
    if (details.paymentList.length === 0) {
      return {
        paymentResult: {
          status: StatusEnum.error,
          message: {},
        },
        nrConnectionsFsp: details.paymentList.length,
        nrSuccessfull: details.paymentList.length,
      };
    }

    paymentResult = await this.sendPayment(
      fsp,
      details.paymentList,
      program.id,
      installment,
    );

    const enrichedTransactions = await this.getEnrichedTransactions(
      paymentResult,
      details.connectionsForFsp,
      fsp,
      program.id,
      installment,
    );
    const successfullTransactions = enrichedTransactions.filter(
      i => i.status === StatusEnum.success,
    );

    await this.logFspCall(
      fsp,
      details.paymentList,
      paymentResult.status,
      paymentResult.message,
    );

    for (let connection of enrichedTransactions) {
      await this.storeTransaction(
        amount,
        connection,
        fsp,
        program,
        installment,
      );
    }

    return {
      paymentResult,
      nrConnectionsFsp: details.paymentList.length,
      nrSuccessfull: successfullTransactions.length,
    };
  }

  private async getEnrichedTransactions(
    paymentResult,
    connectionsForFsp,
    fsp,
    programId: number,
    installment: number,
  ): Promise<any[]> {
    let enrichedTransactions;
    if (paymentResult.status === StatusEnum.success) {
      if (fsp.fsp === fspName.mpesa) {
        enrichedTransactions = [];
        for (let transaction of paymentResult.message.entries) {
          let notification;
          if (!transaction.errorMessage) {
            notification = await this.listenAfricasTalkingtNotification(
              transaction,
              programId,
              installment,
            );
          }

          const enrichedTransaction = connectionsForFsp.find(
            i => i.customData.phoneNumber === transaction.phoneNumber,
          );

          enrichedTransaction.status =
            transaction.errorMessage || notification.status === 'Failed'
              ? StatusEnum.error
              : StatusEnum.success;

          enrichedTransaction.errorMessage = transaction.errorMessage
            ? transaction.errorMessage
            : notification.status === 'Failed'
            ? notification.description
            : '';

          enrichedTransactions.push(enrichedTransaction);
        }
      } else {
        enrichedTransactions = connectionsForFsp;
        enrichedTransactions.forEach(i => {
          i.status = StatusEnum.success;
        });
      }
    } else {
      enrichedTransactions = connectionsForFsp;
      enrichedTransactions.forEach(i => {
        i.status = StatusEnum.error;
        i.errorMessage = 'Whole FSP failed: ' + paymentResult.message.error;
      });
    }
    return enrichedTransactions;
  }

  private async listenAfricasTalkingtNotification(
    transaction,
    programId: number,
    installment: number,
  ): Promise<any> {
    // Don't listen to notification locally, because callback URL is not set
    // If you want to work on this piece of code, disable this DEBUG-workaround
    if (DEBUG) {
      return { status: 'Success' };
    }
    let filteredNotifications = [];
    while (filteredNotifications.length === 0) {
      const notifications = await this.africasTalkingNotificationRepository.find(
        {
          where: { destination: transaction.phoneNumber },
          order: { timestamp: 'DESC' },
        },
      );
      filteredNotifications = notifications.filter(i => {
        return (
          i.value === transaction.value &&
          i.requestMetadata['installment'] === String(installment) &&
          i.requestMetadata['programId'] === String(programId)
        );
      });
    }
    return filteredNotifications[0];
  }

  private async createPaymentDetails(
    includedConnections: ConnectionEntity[],
    amount: number,
    fspId: number,
  ): Promise<PaymentDetailsDto> {
    const fsp = await this.getFspById(fspId);
    const paymentList = [];
    const connectionsForFsp = [];
    for (let connection of includedConnections) {
      if (connection.fsp && connection.fsp.id === fsp.id) {
        const paymentDetails = {
          amount: amount,
        };
        for (let attribute of fsp.attributes) {
          paymentDetails[attribute.name] =
            connection.customData[attribute.name];
        }
        paymentList.push(paymentDetails);
        connectionsForFsp.push(connection);
      }
    }
    return { connectionsForFsp, paymentList };
  }

  public async sendPayment(
    fsp: FinancialServiceProviderEntity,
    payload,
    programId,
    installment,
  ): Promise<StatusMessageDto> {
    if (fsp.fsp === fspName.intersolve) {
      return this.intersolveService.sendPayment(payload);
    } else if (fsp.fsp === fspName.mpesa) {
      return this.africasTalkingService.sendPayment(
        payload,
        programId,
        installment,
      );
    } else {
      const status = StatusEnum.error;
      // Handle other FSP's here
      // This will result in an HTTP-exception
      return { status, message: { error: 'FSP not integrated yet.' } };
    }
  }

  public async logFspCall(
    fsp: FinancialServiceProviderEntity,
    payload,
    status,
    paymentResult,
  ): Promise<void> {
    const fspCallLog = new FspCallLogEntity();
    fspCallLog.fsp = fsp;
    fspCallLog.payload = payload;
    fspCallLog.status = status;
    fspCallLog.response = paymentResult;

    await this.fspCallLogRepository.save(fspCallLog);
  }

  private async storeTransaction(
    amount: number,
    connection: any,
    fsp: FinancialServiceProviderEntity,
    program: ProgramEntity,
    installment: number,
  ): Promise<void> {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.connection = connection;
    transaction.financialServiceProvider = fsp;
    transaction.program = program;
    transaction.installment = installment;
    transaction.status = connection.status;
    transaction.errorMessage = connection.errorMessage;

    this.transactionRepository.save(transaction);
  }

  public async getFspById(id: number): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne(id, {
      relations: ['attributes'],
    });
    return fsp;
  }

  public async testSoap(): Promise<any> {
    console.log('testSoap:');
    await this.intersolveApiService.test();
  }
}
