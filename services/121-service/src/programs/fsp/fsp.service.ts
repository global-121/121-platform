import { StatusEnum } from './../../shared/enum/status.enum';
import { StatusMessageDto } from '../../shared/dto/status-message.dto';
import { Injectable } from '@nestjs/common';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import {
  fspName,
  FinancialServiceProviderEntity,
} from './financial-service-provider.entity';
import { INTERSOLVE, AFRICASTALKING } from '../../secrets';
import { FspApiService } from './fsp-api.service';
import { FspCallLogEntity } from './fsp-call-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { ProgramEntity } from '../program/program.entity';
import { TransactionEntity } from '../program/transactions.entity';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { FspPaymentResultDto } from './dto/fsp-payment-results.dto';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
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

  public constructor(private readonly fspApiService: FspApiService) {}

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
      program.id,
      installment,
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

    paymentResult = await this.sendPayment(fsp, details.payload);

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
      details.payload,
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
    programId: number,
    installment: number,
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

    let payload;
    if (fsp.fsp === fspName.intersolve) {
      payload = this.createIntersolveDetails(paymentList);
    } else if (fsp.fsp === fspName.mpesa) {
      payload = this.createAfricasTalkingDetails(
        paymentList,
        programId,
        installment,
      );
    } else {
      payload = paymentList;
    }
    return { paymentList, connectionsForFsp, payload };
  }

  private createIntersolveDetails(paymentList: any[]): object {
    const payload = {
      expectedDeliveryDate: '2020-04-07T12:45:21.072Z',
      extOrderReference: '123456',
      extInvoiceReference: '123456F',
      fulfillmentInstructions: 'enter instructions here',
      personalCardText: 'Thank you',
      customInvoiceAddress: false,
      orderLines: [],
    };

    for (let item of paymentList) {
      const orderLine = {
        productCode: INTERSOLVE.productCode,
        productValue: item.amount,
        packageCode: INTERSOLVE.packageCode,
        amount: 1,
        customShipToAddress: true,
        customShipToEmail: item.email,
      };
      payload.orderLines.push(orderLine);
    }

    return payload;
  }

  private createAfricasTalkingDetails(
    paymentList: any[],
    programId: number,
    installment: number,
  ): object {
    const payload = {
      username: AFRICASTALKING.username,
      productName: AFRICASTALKING.productName,
      recipients: [],
    };

    for (let item of paymentList) {
      const recipient = {
        phoneNumber: item.phoneNumber,
        currencyCode: AFRICASTALKING.currencyCode,
        amount: item.amount,
        metadata: {
          programId: String(programId),
          installment: String(installment),
        },
      };
      payload.recipients.push(recipient);
    }

    return payload;
  }

  public async sendPayment(
    fsp: FinancialServiceProviderEntity,
    payload,
  ): Promise<StatusMessageDto> {
    if (fsp.fsp === fspName.intersolve) {
      return this.fspApiService.sendPaymentIntersolve(fsp.apiUrl, payload);
    } else if (fsp.fsp === fspName.mpesa) {
      return this.fspApiService.sendPaymentMpesa(payload);
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

  public async africasTalkingValidation(
    africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<any> {
    return {
      status: 'Validated', // 'Validated' or 'Failed'
    };
  }

  public async africasTalkingNotification(
    africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<void> {
    await this.africasTalkingNotificationRepository.save(
      africasTalkingNotificationData,
    );
  }
}
