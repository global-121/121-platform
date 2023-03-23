import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { PreOrderInfoDto } from './dto/pre-order-info.dto';
import { JumboPaymentInfoEnum } from './enum/jumbo-payment-info.enum';
import { IntersolveJumboApiService } from './instersolve-jumbo.api.service';

@Injectable()
export class IntersolveJumboService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  private readonly allowedEuroPerCard = 44;
  private readonly maxPaymentAmountMultiplier = 3;
  public constructor(
    private readonly intersolveJumboApiService: IntersolveJumboApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    payment: number,
    amountOfEuro: number,
  ): Promise<any> {
    const result = new FspTransactionResultDto();
    result.paList = [];
    console.log('amount: ', amountOfEuro);
    this.checkAmount(amountOfEuro);
    console.log('paPaymentList: ', paPaymentList);
    const jumboAddressInfoArray = await this.getPaymentInfoJumbo(
      paPaymentList.map((pa) => pa.referenceId),
    );

    for (const jumboAddressInfo of jumboAddressInfoArray) {
      const paResult = await this.sendIndividualPayment(
        jumboAddressInfo,
        payment,
      );
      if (!paResult) {
        continue;
      }
    }
  }

  private checkAmount(amountOfEuro: number): void {
    if (amountOfEuro !== this.allowedEuroPerCard) {
      const e = `Amount of euro (${amountOfEuro}) is not allowed ${this.allowedEuroPerCard}`;
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  // result.paList.push(paResult);
  // // If 'waiting' then transaction is stored already earlier, to make sure it's there before status-callback comes in
  // if (paResult.status !== StatusEnum.waiting) {
  //   const registration = await this.registrationRepository.findOne({
  //     select: ['id', 'programId'],
  //     where: { referenceId: paResult.referenceId },
  //   });
  // await this.storeTransactionResult(
  //   payment,
  //   paResult.calculatedAmount,
  //   registration.id,
  //   1,
  //   paResult.status,
  //   paResult.message,
  //   registration.programId,
  // );
  //   }
  // }
  // result.fspName = paPaymentList[0].fspName;
  // return result;

  private async getPaymentInfoJumbo(
    referenceIds: string[],
  ): Promise<PreOrderInfoDto[]> {
    console.log('referenceIds: ', referenceIds);
    const relationOptions = await this.getRelationOptionsForJumbo(
      referenceIds[0],
    );
    const query = this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        `registration.referenceId as "referenceId"`,
        `registration."${GenericAttributes.phoneNumber}"`,
        `registration."${GenericAttributes.preferredLanguage}"`,
        `registration."${GenericAttributes.paymentAmountMultiplier}"`,
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
    console.log('jumboAdressInfoDtoArray: ', jumboAdressInfoDtoArray);
    return jumboAdressInfoDtoArray;
  }

  private async getRelationOptionsForJumbo(
    referenceId: string,
  ): Promise<RegistrationDataOptions[]> {
    const registration = await this.registrationRepository.findOne({
      select: ['id', 'programId'],
      where: { referenceId: referenceId },
    });
    console.log('registration: ', registration);
    const registrationDataOptions: RegistrationDataOptions[] = [];
    for (const attr of Object.values(JumboPaymentInfoEnum)) {
      console.log('attr: ', attr);
      const relation = await registration.getRelationForName(attr);

      console.log('relation: ', relation);
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

    if (paymentInfo.paymentAmountMultiplier > 3) {
      result.status = StatusEnum.error;
      result.message = `Payment amount multiplier is higher than ${this.maxPaymentAmountMultiplier}`;
      return result;
    } else {
      const preOrderResult =
        await this.intersolveJumboApiService.createPreOrder(
          paymentInfo,
          payment,
        );
      console.log('preOrderResult: ', preOrderResult);
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
  ): Promise<void> {
    const transactionResultDto = await this.createTransactionResult(
      amount,
      registrationId,
      errorMessage,
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
  ): Promise<PaTransactionResultDto> {
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId },
      relations: ['fsp', 'program'],
    });

    const transactionResult = new PaTransactionResultDto();
    transactionResult.calculatedAmount = amount;
    transactionResult.date = new Date();
    transactionResult.referenceId = registration.referenceId;

    transactionResult.message = errorMessage;
    return transactionResult;
  }
}
