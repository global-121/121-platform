import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
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

  private readonly maxPaymentAmountMultiplier = 3;
  // Hardcoding this to 22, because this would not work with any other number. And for the future when the fixedTransferValue can be changed in the program edit page.
  private readonly fixedPaymentAmount = 22;
  private readonly apiBatchSize = 500;

  public constructor(
    private readonly intersolveJumboApiService: IntersolveJumboApiService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async sendPayment(
    paPaymentArray: PaPaymentDataDto[],
    programId: number,
    payment: number,
    amount: number,
  ): Promise<void> {
    // If amount is not allowed store failed transactions for all PA's
    if (amount !== this.fixedPaymentAmount) {
      return await this.storeFailedTransactionsInvalidAmount(
        paPaymentArray,
        payment,
        amount,
        programId,
        this.fixedPaymentAmount,
      );
    }

    // Split into batches
    const batches: PaPaymentDataDto[][] = [];
    for (let i = 0; i < paPaymentArray.length; i += this.apiBatchSize) {
      const batch: PaPaymentDataDto[] = paPaymentArray.slice(
        i,
        i + this.apiBatchSize,
      );
      batches.push(batch);
    }
    for (const batch of batches) {
      let batchResult: PaTransactionResultDto[] = [];
      batchResult = await this.sendBatchPayment(batch, payment, amount);
      for (const paResult of batchResult) {
        paResult.calculatedAmount =
          paResult.status === StatusEnum.error // if error, take original amount
            ? amount
            : paResult.calculatedAmount;
        await this.storeTransactionResult(paResult, payment, 1, programId);
      }
    }
  }

  private async getPaPaymentDetails(
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
    paPaymentArray: PaPaymentDataDto[],
    payment: number,
    amount: number,
  ): Promise<PaTransactionResultDto[]> {
    const batchResult: PaTransactionResultDto[] = [];
    const paymentDetailsArray = await this.getPaPaymentDetails(
      paPaymentArray.map((pa) => pa.referenceId),
    );

    // Filter out orderlines/PA of which maxPaymentAmountMultiplier is exceeded
    for (const [index, paymentDetails] of paymentDetailsArray.entries()) {
      if (
        paymentDetails.paymentAmountMultiplier > this.maxPaymentAmountMultiplier
      ) {
        const transactionResult = this.createTransactionResult(
          this.fixedPaymentAmount,
          paymentDetails.referenceId,
          `Payment amount multiplier is higher than ${this.maxPaymentAmountMultiplier}. Adjust it, and retry this payment.`,
          StatusEnum.error,
        );
        batchResult.push(transactionResult);

        // Remove PA from this batch
        paymentDetailsArray.splice(index, 1);
      }
    }

    // Create pre-order for the whole batch
    const batchPreOrderResult =
      await this.intersolveJumboApiService.createPreOrder(
        paymentDetailsArray,
        payment,
        amount,
        false,
      );

    if (
      batchPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
        .ResultCode._cdata === IntersolveJumboResultCode.Ok
    ) {
      // Creating pre-order for the whole batch was successful, so approve call can be made
      const approvePreorderResult = await this.approvePreorder(
        batchPreOrderResult,
        paymentDetailsArray,
        batchResult,
        amount,
      );
      return approvePreorderResult;
    } else {
      // Loop over paymentDetailsArray and try to create pre-order for each PA individually
      for (const [index, paymentDetails] of paymentDetailsArray.entries()) {
        const retryPreOrderResult =
          await this.intersolveJumboApiService.createPreOrder(
            [paymentDetails],
            payment,
            amount,
            false,
          );
        // If that fails, create failed transaction and splice from paymentDetailsArray
        if (
          retryPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
            .ResultCode._cdata !== IntersolveJumboResultCode.Ok
        ) {
          // Create failed transaction
          const transactionResult = this.createTransactionResult(
            this.fixedPaymentAmount,
            paymentDetails.referenceId,
            `Something went wrong while creating pre-order: ${retryPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${retryPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`,
            StatusEnum.error,
          );
          batchResult.push(transactionResult);
          // Remove PA from batch
          paymentDetailsArray.splice(index, 1);
        }
      }

      if (paymentDetailsArray.length === 0) {
        return batchResult;
      }

      // When done with loop call createPreOrder and approvePreorder again
      const retryBatchPreOrderResult =
        await this.intersolveJumboApiService.createPreOrder(
          paymentDetailsArray,
          payment,
          amount,
          false,
        );

      if (
        retryBatchPreOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
          .ResultCode._cdata !== IntersolveJumboResultCode.Ok
      ) {
        for (const paymentDetails of paymentDetailsArray) {
          const transactionResult = this.createTransactionResult(
            this.fixedPaymentAmount,
            paymentDetails.referenceId,
            'Something went wrong while creating batch pre-order. This is not related to any individual PA.',
            StatusEnum.error,
          );
          batchResult.push(transactionResult);
        }
        return batchResult;
      } else {
        // Approve adjusted pre-order
        const approvePreorderResult = await this.approvePreorder(
          retryBatchPreOrderResult,
          paymentDetailsArray,
          batchResult,
          amount,
        );
        return approvePreorderResult;
      }
    }
  }

  private async approvePreorder(
    batchPreOrderResult: any,
    preOrderInfoArray: PreOrderInfoDto[],
    batchResult: PaTransactionResultDto[],
    amount: number,
  ): Promise<PaTransactionResultDto[]> {
    // Approve pre-order
    const approvePreOrderResult =
      await this.intersolveJumboApiService.approvePreOrder(batchPreOrderResult);
    if (
      approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest
        .ResultCode._cdata !== IntersolveJumboResultCode.Ok
    ) {
      for (const paymentInfo of preOrderInfoArray) {
        const transactionResult = this.createTransactionResult(
          this.fixedPaymentAmount,
          paymentInfo.referenceId,
          `Something went wrong while approving pre-order: ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`,
          StatusEnum.error,
        );
        batchResult.push(transactionResult);
      }
      return batchResult;
    } else {
      for (const paymentInfo of preOrderInfoArray) {
        const transactionNotification = {
          notificationKey: 'jumboCardSent',
          dynamicContent: [
            String(paymentInfo.paymentAmountMultiplier),
            String(amount),
          ],
        };
        const transactionResult = this.createTransactionResult(
          paymentInfo.paymentAmountMultiplier * amount,
          paymentInfo.referenceId,
          null,
          StatusEnum.success,
          [transactionNotification],
        );

        batchResult.push(transactionResult);
      }
      return batchResult;
    }
  }

  private async storeFailedTransactionsInvalidAmount(
    paPaymentArray: PaPaymentDataDto[],
    payment: number,
    amount: number,
    programId: number,
    allowedEuroPerCard: number,
  ): Promise<void> {
    for (const paPayment of paPaymentArray) {
      const transactionResult = this.createTransactionResult(
        allowedEuroPerCard,
        paPayment.referenceId,
        `Amount ${amount} is not allowed. It should be ${allowedEuroPerCard}. The amount of this payment has been automatically adjusted to the correct amount. You can now retry the payment.`,
        StatusEnum.error,
      );
      this.storeTransactionResult(transactionResult, payment, 1, programId);
    }
  }

  private async storeTransactionResult(
    paTransactionResult: PaTransactionResultDto,
    paymentNr: number,
    transactionStep: number,
    programId: number,
  ): Promise<void> {
    this.transactionsService.storeTransactionUpdateStatus(
      paTransactionResult,
      programId,
      paymentNr,
      transactionStep,
    );
  }

  private createTransactionResult(
    amount: number,
    referenceId: string,
    errorMessage: string,
    status: StatusEnum,
    notificationObjects?: TransactionNotificationObject[],
  ): PaTransactionResultDto {
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
