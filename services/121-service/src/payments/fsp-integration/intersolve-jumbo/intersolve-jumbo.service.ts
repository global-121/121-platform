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

    let preOrderResultFinished = false;
    let preOrderResult;
    while (preOrderResultFinished === false) {
      // Create pre-order
      preOrderResult = await this.intersolveJumboApiService.createPreOrder(
        paymentDetailsArray,
        payment,
        amount,
      );

      // If API-calls for general reason (e.g. timeout) return early with failed transactions
      if (!preOrderResult?.['tns:CreatePreOrderResponse']) {
        console.log(
          'An error occured while doing the create pre-order request.',
        );
        for (const paymentDetails of paymentDetailsArray) {
          const transactionResult = this.createTransactionResult(
            amount,
            paymentDetails.referenceId,
            `A general error occured while creating batch pre-order.`,
            StatusEnum.error,
          );
          batchResult.push(transactionResult);
        }
        return batchResult;
      }

      const resultCode =
        preOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
          .ResultCode._cdata;
      if (resultCode === IntersolveJumboResultCode.Ok) {
        // if OK, skip out of while loop
        preOrderResultFinished = true;
      } else {
        // if not OK
        const resultDescription =
          preOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
            .ResultDescription._cdata;
        const errorMessage = `Something went wrong while creating pre-order: ${resultCode} - ${resultDescription}`;
        if (resultCode === IntersolveJumboResultCode.InvalidOrderLine) {
          // if due to invalid order line, get error line number
          const errorLineNumber = resultDescription
            .split(':')[0]
            .split('OrderLine ')[1];
          const errorIndex = Number(errorLineNumber) - 1;

          // Create failed transaction for this PA
          const transactionResult = this.createTransactionResult(
            amount,
            paymentDetailsArray[errorIndex].referenceId,
            errorMessage,
            StatusEnum.error,
          );
          batchResult.push(transactionResult);

          // Remove PA from batch and start while loop from the top to retry
          paymentDetailsArray.splice(errorIndex, 1);

          // except if nothing left in batch, then return early
          if (paymentDetailsArray.length === 0) {
            return batchResult;
          }
        } else {
          // if another error than invalidOrderLine, then we cannot fix it per PA, skip out of while loop
          preOrderResultFinished = true;

          // .. and create failed transactions for remaining PAs
          for (const paymentDetails of paymentDetailsArray) {
            const transactionResult = this.createTransactionResult(
              amount,
              paymentDetails.referenceId,
              errorMessage,
              StatusEnum.error,
            );
            batchResult.push(transactionResult);
          }
          // .. and return early
          return batchResult;
        }
      }
    }

    // Approve pre-order
    const approvePreorderResult = await this.approvePreOrder(
      preOrderResult,
      paymentDetailsArray,
      batchResult,
      amount,
    );
    return approvePreorderResult;
  }

  private async approvePreOrder(
    batchPreOrderResult: any,
    preOrderInfoArray: PreOrderInfoDto[],
    batchResult: PaTransactionResultDto[],
    amount: number,
  ): Promise<PaTransactionResultDto[]> {
    const approvePreOrderResult =
      await this.intersolveJumboApiService.approvePreOrder(batchPreOrderResult);
    if (
      approvePreOrderResult?.['tns:ApprovePreOrderResponse']?.WebserviceRequest
        ?.ResultCode?._cdata === IntersolveJumboResultCode.Ok
    ) {
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
    } else {
      const errorMessage = !approvePreOrderResult?.[
        'tns:ApprovePreOrderResponse'
      ]
        ? `A general error occured while approving pre-order.`
        : `Something went wrong while approving pre-order: ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`;
      for (const paymentInfo of preOrderInfoArray) {
        const transactionResult = this.createTransactionResult(
          amount,
          paymentInfo.referenceId,
          errorMessage,
          StatusEnum.error,
        );
        batchResult.push(transactionResult);
      }
      return batchResult;
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
