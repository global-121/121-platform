import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import {
  RegistrationDataOptions,
  RegistrationDataRelation,
} from '../../../registration/dto/registration-data-relation.model';
import { GenericAttributes } from '../../../registration/enum/custom-data-attributes';
import { RegistrationDataEntity } from '../../../registration/registration-data.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { PaTransactionResultDto } from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { IntersolveJumboResultCode } from './enum/intersolve-jumbo-result-code.enum';
import { JumboPaymentInfoEnum } from './enum/jumbo-payment-info.enum';
import { IntersolveJumboApiService } from './intersolve-jumbo.api.service';

@Injectable()
export class IntersolveJumboService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  private readonly allowedEuroPerCard = 22;
  private readonly maxPaymentAmountMultiplier = 3;
  public constructor(
    private readonly intersolveJumboApiService: IntersolveJumboApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    payment: number,
    amountOfEuro: number,
  ): Promise<void> {
    const jumboAddressInfoArray = await this.getPaymentInfoJumbo(
      paPaymentList.map((pa) => pa.referenceId),
    );

    for (const jumboAddressInfo of jumboAddressInfoArray) {
      let paResult;
      if (amountOfEuro === this.allowedEuroPerCard) {
        paResult = await this.sendIndividualPayment(jumboAddressInfo, payment);
        if (!paResult) {
          continue;
        }
      } else {
        paResult = new PaTransactionResultDto();
        paResult.status = StatusEnum.error;
        paResult.message = `Amount ${amountOfEuro} is not allowed. It should be ${this.allowedEuroPerCard}. The amount of this payment has been automatically adjusted to the correct amount. You can now retry the payment either for this PA only, or for all failed ones.`;
        paResult.calculatedAmount = this.allowedEuroPerCard;
        paResult.referenceId = jumboAddressInfo.referenceId;
      }

      const registration = await this.registrationRepository.findOne({
        select: ['id', 'programId'],
        where: { referenceId: paResult.referenceId },
      });
      await this.storeTransactionResult(
        payment,
        paResult.calculatedAmount,
        registration.id,
        1,
        paResult.message,
        registration.programId,
        paResult.status,
      );
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
        return this.customDataEntrySubQuery(subQuery, r.relation);
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
    for (const attr of Object.values(JumboPaymentInfoEnum)) {
      const relation = await registration.getRelationForName(attr);
      const registrationDataOption = {
        name: attr,
        relation: relation,
      };
      registrationDataOptions.push(registrationDataOption);
    }
    return registrationDataOptions;
  }

  private customDataEntrySubQuery(
    subQuery: SelectQueryBuilder<any>,
    relation: RegistrationDataRelation,
  ): SelectQueryBuilder<any> {
    const uniqueSubQueryId = uuid().replace(/-/g, '').toLowerCase();
    subQuery = subQuery
      .where(`"${uniqueSubQueryId}"."registrationId" = registration.id`)
      .from(RegistrationDataEntity, uniqueSubQueryId);
    if (relation.programQuestionId) {
      subQuery = subQuery.andWhere(
        `"${uniqueSubQueryId}"."programQuestionId" = ${relation.programQuestionId}`,
      );
    } else if (relation.monitoringQuestionId) {
      subQuery = subQuery.andWhere(
        `"${uniqueSubQueryId}"."monitoringQuestionId" = ${relation.monitoringQuestionId}`,
      );
    } else if (relation.programCustomAttributeId) {
      subQuery = subQuery.andWhere(
        `"${uniqueSubQueryId}"."programCustomAttributeId" = ${relation.programCustomAttributeId}`,
      );
    } else if (relation.fspQuestionId) {
      subQuery = subQuery.andWhere(
        `"${uniqueSubQueryId}"."fspQuestionId" = ${relation.fspQuestionId}`,
      );
    }
    // Because of string_agg no distinction between multi-select and other is needed
    subQuery.addSelect(
      `string_agg("${uniqueSubQueryId}".value,'|' order by value)`,
    );
    return subQuery;
  }

  public async sendIndividualPayment(
    paymentInfo: PreOrderInfoDto,
    payment: number,
  ): Promise<PaTransactionResultDto> {
    const result = new PaTransactionResultDto();
    result.referenceId = paymentInfo.referenceId;
    result.calculatedAmount =
      paymentInfo.paymentAmountMultiplier * this.allowedEuroPerCard;
    result.fspName = FspName.intersolveJumboPhysical;

    if (paymentInfo.paymentAmountMultiplier > this.maxPaymentAmountMultiplier) {
      result.status = StatusEnum.error;
      result.message = `Payment amount multiplier is higher than ${this.maxPaymentAmountMultiplier}`;
      return result;
    } else {
      // Create pre-order
      const preOrderResult =
        await this.intersolveJumboApiService.createPreOrder(
          paymentInfo,
          payment,
          this.allowedEuroPerCard,
        );
      if (
        preOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest
          .ResultCode._cdata !== IntersolveJumboResultCode.Ok
      ) {
        result.status = StatusEnum.error;
        result.message = `Something went wrong while creating pre-order: ${preOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${preOrderResult['tns:CreatePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`;
        return result;
      }

      // Approve pre-order
      const approvePreOrderResult =
        await this.intersolveJumboApiService.approvePreOrder(preOrderResult);
      if (
        approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest
          .ResultCode._cdata !== IntersolveJumboResultCode.Ok
      ) {
        result.status = StatusEnum.error;
        result.message = `Something went wrong while approving pre-order: ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultCode._cdata} - ${approvePreOrderResult['tns:ApprovePreOrderResponse'].WebserviceRequest.ResultDescription._cdata}`;
        return result;
      }

      return result;
    }
  }

  public async storeTransactionResult(
    paymentNr: number,
    amount: number,
    registrationId: number,
    transactionStep: number,
    errorMessage: string,
    programId: number,
    status?: StatusEnum,
  ): Promise<void> {
    const transactionResultDto = await this.createTransactionResult(
      amount,
      registrationId,
      errorMessage,
      status,
    );
    this.transactionsService.storeTransactionUpdateStatus(
      transactionResultDto,
      programId,
      paymentNr,
      transactionStep,
    );
  }

  public async createTransactionResult(
    amount: number,
    registrationId: number,
    errorMessage: string,
    status?: StatusEnum,
  ): Promise<PaTransactionResultDto> {
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId },
      relations: ['fsp', 'program'],
    });

    const transactionResult = new PaTransactionResultDto();
    transactionResult.referenceId = registration.referenceId;
    transactionResult.status = status ? status : StatusEnum.success;
    transactionResult.message = errorMessage;
    transactionResult.calculatedAmount = amount;
    transactionResult.date = new Date();
    transactionResult.fspName = FspName.intersolveJumboPhysical;

    return transactionResult;
  }
}
