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
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  private readonly maxPaymentAmountMultiplier = 3;

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

    for (const jumboAddressInfo of jumboAddressInfoArray) {
      let paResult;
      if (amount === allowedEuroPerCard) {
        paResult = await this.sendIndividualPayment(
          jumboAddressInfo,
          payment,
          amount,
        );
        if (!paResult) {
          continue;
        }
      } else {
        paResult = new PaTransactionResultDto();
        paResult.status = StatusEnum.error;
        paResult.message = `Amount ${amount} is not allowed. It should be ${allowedEuroPerCard}. The amount of this payment has been automatically adjusted to the correct amount. You can now retry the payment either for this PA only, or for all failed ones.`;
        paResult.calculatedAmount = amount;
        paResult.referenceId = jumboAddressInfo.referenceId;
      }

      await this.storeTransactionResult(
        payment,
        paResult.calculatedAmount,
        paResult.referenceId,
        1,
        paResult.message,
        programId,
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

  public async sendIndividualPayment(
    paymentInfo: PreOrderInfoDto,
    payment: number,
    amount: number,
  ): Promise<PaTransactionResultDto> {
    const result = new PaTransactionResultDto();
    result.referenceId = paymentInfo.referenceId;
    result.calculatedAmount = paymentInfo.paymentAmountMultiplier * amount;
    result.fspName = FspName.intersolveJumboPhysical;

    if (paymentInfo.paymentAmountMultiplier > this.maxPaymentAmountMultiplier) {
      result.status = StatusEnum.error;
      result.message = `Payment amount multiplier is higher than ${this.maxPaymentAmountMultiplier}`;
      result.calculatedAmount = amount;
      return result;
    } else {
      // Create pre-order
      const preOrderResult =
        await this.intersolveJumboApiService.createPreOrder(
          paymentInfo,
          payment,
          amount,
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

      result.status = StatusEnum.success;
      return result;
    }
  }

  private async storeTransactionResult(
    paymentNr: number,
    amount: number,
    referenceId: string,
    transactionStep: number,
    errorMessage: string,
    programId: number,
    status: StatusEnum,
  ): Promise<void> {
    const transactionResultDto = await this.createTransactionResult(
      amount,
      referenceId,
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

  private async createTransactionResult(
    amount: number,
    referenceId: string,
    errorMessage: string,
    status: StatusEnum,
  ): Promise<PaTransactionResultDto> {
    const transactionResult = new PaTransactionResultDto();
    transactionResult.referenceId = referenceId;
    transactionResult.status = status ? status : StatusEnum.success;
    transactionResult.message = errorMessage;
    transactionResult.calculatedAmount = amount;
    transactionResult.date = new Date();
    transactionResult.fspName = FspName.intersolveJumboPhysical;

    return transactionResult;
  }
}
