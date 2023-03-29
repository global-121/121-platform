import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationDataOptions } from '../../../registration/dto/registration-data-relation.model';
import { GenericAttributes } from '../../../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { RegistrationsService } from '../../../registration/registrations.service';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { IntersolveJumboPaymentInfoEnum } from './enum/intersolve-jumbo-payment-info.enum';
import { IntersolveJumboResultCode } from './enum/intersolve-jumbo-result-code.enum';
import { IntersolveJumboApiService } from './intersolve-jumbo.api.service';

@Injectable()
export class IntersolveJumboService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  private readonly maxPaymentAmountMultiplier = 3;
  private readonly apiBatchSize = 500;

  public constructor(
    private readonly intersolveJumboApiService: IntersolveJumboApiService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    payment: number,
    amount: number,
  ): Promise<void> {
    const jumboAddressInfoArray = await this.getPaymentInfoJumbo(
      paPaymentList.map((pa) => pa.referenceId),
    );

    const program = await this.programRepository.findOne({
      where: { id: programId },
    });
    const allowedEuroPerCard = program.fixedTransferValue;

    // split into batches
    const batches = [];
    for (let i = 0; i < jumboAddressInfoArray.length; i += this.apiBatchSize) {
      const batch = jumboAddressInfoArray.slice(i, i + this.apiBatchSize);
      batches.push(batch);
    }

    for (const batch of batches) {
      let batchResult = [];
      if (amount === allowedEuroPerCard) {
        batchResult = await this.sendBatchPayment(batch, payment, amount);
        if (!batchResult) {
          continue;
        }
      } else {
        for (const paymentInfo of batch) {
          const paResult = new PaTransactionResultDto();
          paResult.status = StatusEnum.error;
          paResult.message = `Amount ${amount} is not allowed. It should be ${allowedEuroPerCard}. The amount of this payment has been automatically adjusted to the correct amount. You can now retry the payment.`;
          paResult.calculatedAmount = allowedEuroPerCard; // set amount to return to allowed amount
          paResult.referenceId = paymentInfo.referenceId;
          batchResult.push(paResult);
        }
      }

      for (const paResult of batchResult) {
        await this.storeTransactionResult(
          payment,
          paResult.status === StatusEnum.error && !paResult.calculatedAmount // if error, take original amount, except if calculatedAmount is specifically set, which otherwise only happens for success-transactions
            ? amount
            : paResult.calculatedAmount,
          paResult.referenceId,
          1,
          paResult.message,
          programId,
          paResult.status,
          paResult.notificationObjects,
        );
      }
    }
  }

  private async getPaymentInfoJumbo(
    referenceIds: string[],
  ): Promise<PreOrderInfoDto[]> {
    const relationOptions = await this.getRelationOptionsForJumbo(
      referenceIds[0],
    );
    const query = this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        `registration.referenceId as "referenceId"`,
        `registration."${GenericAttributes.phoneNumber}"`,
        `registration."${GenericAttributes.preferredLanguage}"`,
        `coalesce(registration."${GenericAttributes.paymentAmountMultiplier}",1) as "paymentAmountMultiplier"`,
      ])
      .where(`registration.referenceId IN (:...referenceIds)`, {
        referenceIds,
      });
    for (const r of relationOptions) {
      query.select((subQuery) => {
        return this.registrationsService.customDataEntrySubQuery(
          subQuery,
          r.relation,
        );
      }, r.name);
    }

    const jumboAdressInfoDtoArray = await query.getRawMany();
    return jumboAdressInfoDtoArray;
  }

  private async getRelationOptionsForJumbo(
    referenceId: string,
  ): Promise<RegistrationDataOptions[]> {
    const registration = await this.registrationRepository.findOne({
      select: ['id', 'programId'],
      where: { referenceId: referenceId },
    });
    const registrationDataOptions: RegistrationDataOptions[] = [];
    for (const attr of Object.values(IntersolveJumboPaymentInfoEnum)) {
      const relation = await registration.getRelationForName(attr);
      const registrationDataOption = {
        name: attr,
        relation: relation,
      };
      registrationDataOptions.push(registrationDataOption);
    }
    return registrationDataOptions;
  }

  private async sendBatchPayment(
    paymentInfoBatch: PreOrderInfoDto[],
    payment: number,
    amount: number,
  ): Promise<PaTransactionResultDto[]> {
    const batchResult = [];
    const includeInBatchApiCall = [];
    for (const paymentInfo of paymentInfoBatch) {
      const result = new PaTransactionResultDto();
      result.referenceId = paymentInfo.referenceId;
      result.fspName = FspName.intersolveJumboPhysical;
      if (
        paymentInfo.paymentAmountMultiplier > this.maxPaymentAmountMultiplier
      ) {
        result.status = StatusEnum.error;
        result.message = `Payment amount multiplier is higher than ${this.maxPaymentAmountMultiplier}. Adjust it, and retry this payment.`;
        batchResult.push(result);
      } else {
        // Create individual pre-order first to validate > this one won't be approved
        const individualPreOrderResult =
          await this.intersolveJumboApiService.createPreOrder(
            [paymentInfo],
            payment,
            amount,
            true,
          );
        if (
          individualPreOrderResult['tns:CreatePreOrderResponse']
            .WebserviceRequest.ResultCode._cdata !==
          IntersolveJumboResultCode.Ok
        ) {
          result.status = StatusEnum.error;
          result.message = `Something went wrong while creating pre-order: ${individualPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${individualPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`;
          batchResult.push(result);
        } else {
          includeInBatchApiCall.push(paymentInfo);
        }
      }
    }

    if (includeInBatchApiCall.length === 0) {
      return batchResult;
    }

    // Create pre-order
    const batchPreOrderResult =
      await this.intersolveJumboApiService.createPreOrder(
        includeInBatchApiCall,
        payment,
        amount,
        false,
      );

    if (
      batchPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
        .ResultCode._cdata !== IntersolveJumboResultCode.Ok
    ) {
      for (const paymentInfo of includeInBatchApiCall) {
        const result = new PaTransactionResultDto();
        result.referenceId = paymentInfo.referenceId;
        result.fspName = FspName.intersolveJumboPhysical;
        result.status = StatusEnum.error;
        result.message =
          'Something went wrong while creating batch pre-order. This is not related to any individual PA.';
        batchResult.push(result);
      }
      return batchResult;
    }

    // Approve pre-order
    const approvePreOrderResult =
      await this.intersolveJumboApiService.approvePreOrder(batchPreOrderResult);
    if (
      approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest
        .ResultCode._cdata !== IntersolveJumboResultCode.Ok
    ) {
      for (const paymentInfo of includeInBatchApiCall) {
        const result = new PaTransactionResultDto();
        result.referenceId = paymentInfo.referenceId;
        result.fspName = FspName.intersolveJumboPhysical;
        result.status = StatusEnum.error;
        result.message = `Something went wrong while approving pre-order: ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`;
        batchResult.push(result);
      }
      return batchResult;
    }

    for (const paymentInfo of includeInBatchApiCall) {
      const result = new PaTransactionResultDto();
      result.referenceId = paymentInfo.referenceId;
      result.fspName = FspName.intersolveJumboPhysical;
      result.status = StatusEnum.success;
      result.calculatedAmount = paymentInfo.paymentAmountMultiplier * amount;
      const transactionNotification = {
        notificationKey: 'jumboCardSent',
        dynamicContent: [
          String(paymentInfo.paymentAmountMultiplier),
          String(amount),
        ],
      };
      result.notificationObjects = [transactionNotification];
      batchResult.push(result);
    }
    return batchResult;
  }

  private async storeTransactionResult(
    paymentNr: number,
    amount: number,
    referenceId: string,
    transactionStep: number,
    errorMessage: string,
    programId: number,
    status: StatusEnum,
    notificationObjects?: TransactionNotificationObject[],
  ): Promise<void> {
    const transactionResultDto = await this.createTransactionResult(
      amount,
      referenceId,
      errorMessage,
      status,
      notificationObjects,
    );
    this.transactionsService.storeTransactionUpdateStatus(
      transactionResultDto,
      programId,
      paymentNr,
      transactionStep,
    );
  }

  private async createTransactionResult(
    amount: number,
    referenceId: string,
    errorMessage: string,
    status: StatusEnum,
    notificationObjects?: TransactionNotificationObject[],
  ): Promise<PaTransactionResultDto> {
    const transactionResult = new PaTransactionResultDto();
    transactionResult.referenceId = referenceId;
    transactionResult.status = status ? status : StatusEnum.success;
    transactionResult.message = errorMessage;
    transactionResult.calculatedAmount = amount;
    transactionResult.date = new Date();
    transactionResult.fspName = FspName.intersolveJumboPhysical;
    transactionResult.notificationObjects = notificationObjects;

    return transactionResult;
  }
}
