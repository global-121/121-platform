import { AfricasTalkingService } from './africas-talking.service';
import { IntersolveService } from './intersolve.service';
import { StatusEnum } from './../../shared/enum/status.enum';
import { StatusMessageDto } from '../../shared/dto/status-message.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import { UpdateFspAttributeDto, UpdateFspDto } from './dto/update-fsp.dto';
import { FspAttributeEntity } from './fsp-attribute.entity';
import { PaPaymentDataDto } from './dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
  PaymentTransactionResultDto,
} from './dto/payment-transaction-result';

@Injectable()
export class FspService {
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;
  @InjectRepository(ConnectionEntity)
  public connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(FspCallLogEntity)
  public fspCallLogRepository: Repository<FspCallLogEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(FspAttributeEntity)
  public fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(AfricasTalkingNotificationEntity)
  public africasTalkingNotificationRepository: Repository<
    AfricasTalkingNotificationEntity
  >;

  public constructor(
    private readonly africasTalkingService: AfricasTalkingService,
    private readonly intersolveService: IntersolveService,
  ) {}

  public async payout(
    paPaymentDataList: PaPaymentDataDto[],
    programId: number,
    installment: number,
    amount: number,
  ): Promise<PaymentTransactionResultDto> {
    // Split List in 2 lists
    const intersolvePaPayment = [];
    const intersolveNoWhatsappPaPayment = [];
    const africasTalkingPaPayment = [];
    for (let paPaymentData of paPaymentDataList) {
      if (paPaymentData.fspName === fspName.intersolve) {
        intersolvePaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === fspName.intersolveNoWhatsapp) {
        intersolveNoWhatsappPaPayment.push(paPaymentData);
      } else if (paPaymentData.fspName === fspName.africasTalking) {
        africasTalkingPaPayment.push(paPaymentData);
      } else {
        console.log('fsp does not exist: paPaymentData: ', paPaymentData);
        throw new HttpException('fsp does not exist.', HttpStatus.NOT_FOUND);
      }
    }

    // Call individual services
    const intersolveTransactionResult = await this.intersolveService.sendPayment(
      intersolvePaPayment,
      true,
      amount,
      installment,
    );
    const intersolveNoWhatsappTransactionResult = await this.intersolveService.sendPayment(
      intersolveNoWhatsappPaPayment,
      false,
      amount,
      installment,
    );
    const africasTalkingTransactionResult = await this.africasTalkingService.sendPayment(
      africasTalkingPaPayment,
      programId,
      installment,
      amount,
    );

    // Call transactions
    this.storeAllTransactions(
      intersolveTransactionResult.paList,
      programId,
      installment,
      amount,
      fspName.intersolve,
    );
    this.storeAllTransactions(
      intersolveNoWhatsappTransactionResult.paList,
      programId,
      installment,
      amount,
      fspName.intersolveNoWhatsapp,
    );
    this.storeAllTransactions(
      africasTalkingTransactionResult.paList,
      programId,
      installment,
      amount,
      fspName.africasTalking,
    );

    // Calculate aggregates
    const fspTransactionResults = [
      ...intersolveTransactionResult.paList,
      ...intersolveNoWhatsappTransactionResult.paList,
      ...africasTalkingTransactionResult.paList,
    ];
    return this.calcAggregateStatus(fspTransactionResults);
  }

  private calcAggregateStatus(
    fspTransactionResults: PaTransactionResultDto[],
  ): PaymentTransactionResultDto {
    const result = new PaymentTransactionResultDto();
    result.nrSuccessfull = 0;
    result.nrFailed = 0;
    for (let paTransactionResult of fspTransactionResults) {
      if (paTransactionResult.status === StatusEnum.success) {
        result.nrSuccessfull += 1;
      } else if (paTransactionResult.status === StatusEnum.error) {
        result.nrFailed += 1;
      }
    }
    return result;
  }

  private async storeAllTransactions(
    transactions: PaTransactionResultDto[],
    programId: number,
    installment: number,
    amount: number,
    fspName: fspName,
  ): Promise<void> {
    for (let transaction of transactions) {
      await this.storeTransaction(
        transaction,
        programId,
        installment,
        amount,
        fspName,
      );
    }
  }

  private async storeTransaction(
    transactionResponse: PaTransactionResultDto,
    programId: number,
    installment: number,
    amount: number,
    fspName: fspName,
  ): Promise<void> {
    const program = await this.programRepository.findOne(programId);
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { fsp: fspName },
    });
    const connection = await this.connectionRepository.findOne({
      where: { did: transactionResponse.did },
    });

    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.connection = connection;
    transaction.financialServiceProvider = fsp;
    transaction.program = program;
    transaction.installment = installment;
    transaction.status = transactionResponse.status;
    transaction.errorMessage = transactionResponse.message;

    this.transactionRepository.save(transaction);
  }

  // public async createSendPaymentListFsp(
  //   fsp: FinancialServiceProviderEntity,
  //   includedConnections: ConnectionEntity[],
  //   amount: number,
  //   program: ProgramEntity,
  //   installment: number,
  // ): Promise<FspPaymentResultDto> {
  //   const details = await this.createPaymentDetails(
  //     includedConnections,
  //     amount,
  //     fsp.id,
  //     installment,
  //   );
  //   let paymentResult;
  //   if (details.paymentList.length === 0) {
  //     return {
  //       paymentResult: {
  //         status: StatusEnum.error,
  //         message: {},
  //       },
  //       nrConnectionsFsp: details.paymentList.length,
  //       nrSuccessfull: details.paymentList.length,
  //     };
  //   }

  //   paymentResult = await this.sendPayment(
  //     fsp,
  //     details.paymentList,
  //     program.id,
  //     installment,
  //   );

  //   const enrichedTransactions = await this.getEnrichedTransactions(
  //     paymentResult,
  //     details.connectionsForFsp,
  //     fsp,
  //     program.id,
  //     installment,
  //   );
  //   const successfullTransactions = enrichedTransactions.filter(
  //     i => i.status === StatusEnum.success,
  //   );

  //   await this.logFspCall(
  //     fsp,
  //     details.paymentList,
  //     paymentResult.status,
  //     paymentResult.message,
  //   );

  //   for (let connection of enrichedTransactions) {
  //     await this.storeTransaction(
  //       amount,
  //       connection,
  //       fsp,
  //       program,
  //       installment,
  //     );
  //   }

  //   return {
  //     paymentResult,
  //     nrConnectionsFsp: details.paymentList.length,
  //     nrSuccessfull: successfullTransactions.length,
  //   };
  // }

  // private async getEnrichedTransactions(
  //   paymentResult,
  //   connectionsForFsp,
  //   fsp,
  //   programId: number,
  //   installment: number,
  // ): Promise<any[]> {
  //   let enrichedTransactions;
  //   if (paymentResult.status === StatusEnum.success) {
  //     if (fsp.fsp === fspName.mpesa) {
  //       enrichedTransactions = [];
  //       for (let transaction of paymentResult.message.entries) {
  //         let notification;
  //         if (!transaction.errorMessage) {
  //           notification = await this.listenAfricasTalkingtNotification(
  //             transaction,
  //             programId,
  //             installment,
  //           );
  //         }

  //         const enrichedTransaction = connectionsForFsp.find(
  //           i =>
  //             i.customData.phoneNumber ===
  //             transaction.phoneNumber.replace(/\D/g, ''),
  //         );

  //         enrichedTransaction.status =
  //           transaction.errorMessage || notification.status === 'Failed'
  //             ? StatusEnum.error
  //             : StatusEnum.success;

  //         enrichedTransaction.errorMessage = transaction.errorMessage
  //           ? transaction.errorMessage
  //           : notification.status === 'Failed'
  //           ? notification.description
  //           : '';

  //         enrichedTransactions.push(enrichedTransaction);
  //       }
  //     } else {
  //       enrichedTransactions = connectionsForFsp;
  //       enrichedTransactions.forEach(i => {
  //         i.status = StatusEnum.success;
  //       });
  //     }
  //   } else {
  //     enrichedTransactions = connectionsForFsp;
  //     enrichedTransactions.forEach(i => {
  //       i.status = StatusEnum.error;
  //       i.errorMessage = 'Whole FSP failed: ' + paymentResult.message;
  //     });
  //   }
  //   return enrichedTransactions;
  // }

  // public async sendPayment(
  //   fsp: FinancialServiceProviderEntity,
  //   payload,
  //   programId,
  //   installment,
  // ): Promise<StatusMessageDto> {
  //   console.log('fsp', fsp);
  //   if (fsp.fsp === fspName.intersolve) {
  //     const whatsapp = true;
  //     return this.intersolveService.sendPayment(payload, whatsapp);
  //   } else if (fsp.fsp === fspName.intersolveNoWhatsapp) {
  //     const whatsapp = false;
  //     return this.intersolveService.sendPayment(payload, whatsapp);
  //   } else if (fsp.fsp === fspName.mpesa) {
  //     return this.africasTalkingService.sendPayment(
  //       payload,
  //       programId,
  //       installment,
  //     );
  //   } else {
  //     const status = StatusEnum.error;
  //     // Handle other FSP's here
  //     // This will result in an HTTP-exception
  //     return { status, message: { error: 'FSP not integrated yet.' } };
  //   }
  // }

  // public async logFspCall(
  //   fsp: FinancialServiceProviderEntity,
  //   payload,
  //   status,
  //   paymentResult,
  // ): Promise<void> {
  //   const fspCallLog = new FspCallLogEntity();
  //   fspCallLog.fsp = fsp;
  //   fspCallLog.payload = payload;
  //   fspCallLog.status = status;
  //   fspCallLog.response = paymentResult;

  //   await this.fspCallLogRepository.save(fspCallLog);
  // }

  public async getFspById(id: number): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne(id, {
      relations: ['attributes'],
    });
    return fsp;
  }

  public async updateFsp(
    updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { fsp: updateFspDto.fsp },
    });
    if (!fsp) {
      const errors = `No fsp found with name ${updateFspDto.fsp}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let key in updateFspDto) {
      if (key !== 'fsp') {
        fsp[key] = updateFspDto[key];
      }
    }

    await this.financialServiceProviderRepository.save(fsp);
    return fsp;
  }

  public async updateFspAttribute(
    updateFspAttributeDto: UpdateFspAttributeDto,
  ): Promise<FspAttributeEntity> {
    const fspAttributes = await this.fspAttributeRepository.find({
      where: { name: updateFspAttributeDto.name },
      relations: ['fsp'],
    });
    // Filter out the right fsp, if fsp-attribute name occurs across multiple fsp's
    const fspAttribute = fspAttributes.filter(
      a => a.fsp.fsp === updateFspAttributeDto.fsp,
    )[0];
    if (!fspAttribute) {
      const errors = `No fspAttribute found with name ${updateFspAttributeDto.name} in fsp with name ${updateFspAttributeDto.fsp}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let key in updateFspAttributeDto) {
      if (key !== 'name' && key !== 'fsp') {
        fspAttribute[key] = updateFspAttributeDto[key];
      }
    }

    await this.fspAttributeRepository.save(fspAttribute);
    return fspAttribute;
  }
}
