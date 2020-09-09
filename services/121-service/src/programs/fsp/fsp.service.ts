import { AfricasTalkingService } from './africas-talking.service';
import { IntersolveService } from './intersolve.service';
import { IntersolveApiService } from './api/instersolve.api.service';
import { SoapService } from './api/soap.service';
import { StatusEnum } from './../../shared/enum/status.enum';
import { StatusMessageDto } from '../../shared/dto/status-message.dto';
import { Injectable } from '@nestjs/common';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import {
  fspName,
  FinancialServiceProviderEntity,
} from './financial-service-provider.entity';
import { INTERSOLVE, AFRICASTALKING } from '../../secrets';
import { AfricasTalkingApiService } from './api/africas-talking.api.service';
import { FspCallLogEntity } from './fsp-call-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { ProgramEntity } from '../program/program.entity';
import { TransactionEntity } from '../program/transactions.entity';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { FspPaymentResultDto } from './dto/fsp-payment-results.dto';

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
      };
    }

    paymentResult = await this.sendPayment(fsp, details.paymentList);

    await this.logFspCall(
      fsp,
      details.paymentList,
      paymentResult.status,
      paymentResult.message,
    );

    if (paymentResult.status === StatusEnum.succes) {
      for (let connection of details.connectionsForFsp) {
        await this.storeTransaction(
          amount,
          connection,
          fsp,
          program,
          installment,
        );
      }
    }

    return { paymentResult, nrConnectionsFsp: details.paymentList.length };
  }

  public async createPaymentDetails(
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
  ): Promise<StatusMessageDto> {
    if (fsp.fsp === fspName.intersolve) {
      return this.intersolveService.sendPayment(payload);
    } else if (fsp.fsp === fspName.mpesa) {
      return this.africasTalkingService.sendPayment(payload);
    } else {
      const status = StatusEnum.error;
      // Handle other FSP's here
      // This will result in an HTTP-exception mentioning that no payment was done for this FSP
      return { status, message: {} };
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
    connection: ConnectionEntity,
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
    transaction.status = 'sent-order';

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
