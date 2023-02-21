import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { RegistrationEntity } from './../../../registration/registration.entity';
import { IntersolveActivateTokenRequestDto } from './dto/intersolve-activate-token-request.dto';
import { IntersolveCreateCustomerResponseBodyDto } from './dto/intersolve-create-custom-respose.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import {
  IntersolveIssueTokenResponseDataDto,
  IntersolveIssueTokenResponseDto,
  IntersolveIssueTokenResponseTokenDto,
} from './dto/intersolve-issue-token-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveReponseErrorDto } from './dto/intersolve-response-error.dto';
import { MessageStatus as MessageStatusDto } from './dto/message-status.dto';
import { IntersolveVisaCardEntity } from './intersolve-visa-card.entity';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaRequestEntity } from './intersolve-visa-request.entity';
import {
  IntersolveEndpoints,
  IntersolveVisaApiService,
} from './intersolve-visa.api.service';

@Injectable()
export class IntersolveVisaService {
  @InjectRepository(RegistrationEntity)
  public registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(IntersolveVisaCustomerEntity)
  public intersolveVisaCustomerRepo: Repository<IntersolveVisaCustomerEntity>;
  @InjectRepository(IntersolveVisaCardEntity)
  public intersolveVisaCardRepository: Repository<IntersolveVisaCardEntity>;
  @InjectRepository(IntersolveVisaRequestEntity)
  public intersolveVisaRequestRepository: Repository<IntersolveVisaRequestEntity>;
  public constructor(
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.intersolveVisa;
    for (const paymentData of paymentList) {
      const calculatedAmount =
        amount * (paymentData.paymentAmountMultiplier || 1);

      const paymentRequestResultPerPa = await this.sendPaymentToPa(
        paymentData,
        paymentNr,
        calculatedAmount,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
    }
    this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      programId,
      paymentNr,
    );

    return fspTransactionResult;
  }

  private async sendPaymentToPa(
    paymentData: PaPaymentDataDto,
    paymentNr: number,
    calculatedAmount: number,
  ): Promise<PaTransactionResultDto> {
    const transactionNotifications = [];

    const registration = await this.registrationRepository.findOne({
      where: { referenceId: paymentData.referenceId },
    });
    const getTokenResult = await this.getOrIssueWalletToken(registration);
    if (getTokenResult.success) {
      transactionNotifications.push(
        this.buildNotificationObjectIssueCard(getTokenResult.tokenCode),
      );
    } else {
      const res = {
        referenceId: paymentData.referenceId,
        status: StatusEnum.error,
        message: getTokenResult.message,
        date: new Date(),
        calculatedAmount: calculatedAmount,
        fspName: FspName.intersolveVisa,
      };
      console.log('res: ', res);
      return res;
    }
    const topupResult = await this.topUpVisaCard(
      getTokenResult.tokenCode,
      calculatedAmount,
      registration.referenceId,
      paymentNr,
    );
    transactionNotifications.push(
      this.buildNotificationObjectLoad(calculatedAmount),
    );
    return {
      referenceId: paymentData.referenceId,
      status: topupResult.status,
      message: topupResult.message,
      date: new Date(),
      calculatedAmount: calculatedAmount,
      fspName: FspName.intersolveVisa,
      notificationObjects: transactionNotifications,
    };
  }

  private buildNotificationObjectIssueCard(
    token: string,
  ): TransactionNotificationObject {
    return {
      notificationKey: 'visaCardCreated',
      dynamicContent: [token],
    };
  }

  private buildNotificationObjectLoad(
    amount: number,
  ): TransactionNotificationObject {
    return {
      notificationKey: 'visaLoad',
      dynamicContent: [String(amount)],
    };
  }

  private async getOrIssueWalletToken(
    registration: RegistrationEntity,
  ): Promise<{ success: boolean; tokenCode?: string; message?: string }> {
    let visaCardEntity = await this.getExistingLinkedWallet(registration.id);
    if (!visaCardEntity) {
      const issueTokenResult = await this.issueToken(registration);
      if (issueTokenResult.success) {
        visaCardEntity = issueTokenResult.visaCard;
      } else {
        return {
          success: false,
          message: issueTokenResult.message,
        };
      }
    }
    if (!visaCardEntity.intersolveVisaCustomer) {
      const registerResult = await this.registerCustomerHolderToWallet(
        registration,
        visaCardEntity.tokenCode,
      );
      if (!registerResult.success) {
        return {
          success: false,
          message: registerResult.message,
        };
      }
      await this.activateToken(visaCardEntity.tokenCode);
    }

    return {
      success: true,
      tokenCode: visaCardEntity.tokenCode,
    };
  }

  private async getExistingLinkedWallet(
    registrationId: number,
  ): Promise<IntersolveVisaCardEntity> {
    const visaCustomer = await this.intersolveVisaCustomerRepo.findOne({
      where: { registrationId: registrationId },
      relations: ['visaCard', 'visaCard.intersolveVisaCustomer'],
    });
    if (visaCustomer && visaCustomer.visaCard) {
      return visaCustomer.visaCard;
    }
  }

  private async getWalletByTokenCode(
    tokenCode: string,
  ): Promise<IntersolveVisaCardEntity> {
    const visaCard = await this.intersolveVisaCardRepository.findOne({
      where: { tokenCode: tokenCode },
    });
    return visaCard;
  }

  private async issueToken(registration: RegistrationEntity): Promise<{
    success: boolean;
    visaCard?: IntersolveVisaCardEntity;
    message?: string;
  }> {
    const visaCardNumber = await registration.getRegistrationDataValueByName(
      'visaCardNumber',
    );

    if (!visaCardNumber) {
      // There is no imported visa card number, so we need to issue a new one
      // TODO: THIS IS AN UNTESTED FLOW
      console.log('ISSUEING NEW CARD');

      const reference = uuid();
      const issueTokenRequest = new IntersolveVisaRequestEntity();
      issueTokenRequest.reference = reference;
      issueTokenRequest.saleId = registration.referenceId;
      issueTokenRequest.endpoint = IntersolveEndpoints.ISSUE_TOKEN;
      const issueTokenRequestEntity =
        await this.intersolveVisaRequestRepository.save(issueTokenRequest);
      const issueTokenResult = await this.intersolveVisaApiService.issueToken(
        issueTokenRequest,
      );
      console.log('issueTokenResult: ', issueTokenResult);
      // issueTokenRequestEntity.statusCode = issueTokenResult.statusCode;
      await this.intersolveVisaRequestRepository.save(issueTokenRequestEntity);

      if (!issueTokenResult.success) {
        return {
          success: issueTokenResult.success,
          message: issueTokenResult.success
            ? null
            : `CARD CREATION ERROR: ${this.intersolveErrorToMessage(
                issueTokenResult.errors,
              )}`,
        };
      } else {
        await this.createIntersolveVisaEntities(registration, issueTokenResult);
        return {
          success: issueTokenResult.success,
          visaCard: await this.getWalletByTokenCode(
            issueTokenResult.data.token.code,
          ),
          message: issueTokenResult.success
            ? null
            : `CARD CREATION ERROR: ${this.intersolveErrorToMessage(
                issueTokenResult.errors,
              )}`,
        };
      }
    } else {
      // There IS an imported visa card number, so we don't need to issue a new one but we need to create the entities
      console.log('ONLY CREATE THE ENTITIES');

      const issueTokenResult = new IntersolveIssueTokenResponseDto();
      issueTokenResult.data = new IntersolveIssueTokenResponseDataDto();
      issueTokenResult.data.token = new IntersolveIssueTokenResponseTokenDto();
      issueTokenResult.success = true;
      issueTokenResult.data.token.code = visaCardNumber;

      await this.createIntersolveVisaEntities(registration, issueTokenResult);
      const visaCard = await this.getWalletByTokenCode(
        issueTokenResult.data.token.code,
      );
      return {
        success: issueTokenResult.success,
        visaCard: visaCard,
      };
    }
  }

  private async createIntersolveVisaEntities(
    registration: RegistrationEntity,
    issueTokenResult: IntersolveIssueTokenResponseDto,
  ): Promise<any> {
    const intersolveVisaCard = new IntersolveVisaCardEntity();
    const visaCustomer = new IntersolveVisaCustomerEntity();
    visaCustomer.registration = registration;
    const createCustomerResult = await this.createIndividual(registration);
    if (!createCustomerResult.data.success) {
      return {
        success: createCustomerResult.data.success,
        message: createCustomerResult.data.success
          ? null
          : `CREATE CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              createCustomerResult.data.errors,
            )}`,
      };
    }
    visaCustomer.holderId = createCustomerResult.data.data.id;
    visaCustomer.blocked = createCustomerResult.data.data.blocked;

    intersolveVisaCard.success = issueTokenResult.success;
    intersolveVisaCard.tokenCode = issueTokenResult.data.token.code;
    intersolveVisaCard.tokenBlocked = issueTokenResult.data.token.blocked;
    intersolveVisaCard.expiresAt = issueTokenResult.data.token.expiresAt;
    intersolveVisaCard.status = issueTokenResult.data.token.status;

    await this.intersolveVisaCustomerRepo.save(visaCustomer);
    await this.intersolveVisaCardRepository.save(intersolveVisaCard);
  }

  private async registerCustomerHolderToWallet(
    registration: RegistrationEntity,
    tokenCode: string,
  ): Promise<{
    success: boolean;
    holderId?: string;
    message?: string;
  }> {
    const customerEntity = await this.intersolveVisaCustomerRepo.findOne({
      where: { registrationId: registration.id },
    });
    const registerHolderResult =
      await this.intersolveVisaApiService.registerHolder(
        {
          holderId: customerEntity.holderId,
        },
        tokenCode,
      );

    if (registerHolderResult.data.success === false) {
      return {
        success: registerHolderResult.data.success,
        message: registerHolderResult.data.success
          ? null
          : `LINK CUSTOMER ERROR: ${registerHolderResult.code}`,
      };
    }

    const visaCard = await this.intersolveVisaCardRepository.findOne({
      where: { tokenCode: tokenCode },
    });
    visaCard.intersolveVisaCustomer = customerEntity;
    customerEntity.visaCard = visaCard;
    await this.intersolveVisaCardRepository.save(visaCard);
    await this.intersolveVisaCustomerRepo.save(customerEntity);

    return {
      success: true,
      holderId: customerEntity.holderId,
    };
  }

  private async createIndividual(
    registration: RegistrationEntity,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
    // TODO: Find a better way to make this less hardcoded
    const lastName = await registration.getRegistrationDataValueByName(
      'nameLast',
    );
    const createCustomerRequest: IntersolveCreateCustomerDto = {
      externalReference: registration.referenceId,
      individual: {
        firstName: 'TODO first name',
        lastName: lastName,
        estimatedAnnualPaymentVolumeMajorUnit: 12 * 44, // This is assuming 44 euro per month for a year
      },
    };
    return await this.intersolveVisaApiService.createCustomer(
      createCustomerRequest,
    );
  }

  private async topUpVisaCard(
    tokenCode: string,
    calculatedAmount: number,
    referenceId: string,
    payment: number,
  ): Promise<MessageStatusDto> {
    const amountInCents = calculatedAmount * 100;
    const interSolveLoadRequest = new IntersolveVisaRequestEntity();
    interSolveLoadRequest.reference = uuid();
    interSolveLoadRequest.endpoint = IntersolveEndpoints.LOAD;
    interSolveLoadRequest.saleId = `${referenceId}-${payment}`;
    interSolveLoadRequest.metadata = JSON.parse(
      JSON.stringify({ tokenCode: tokenCode, quantityValue: amountInCents }),
    );
    const interSolveLoadRequestEntity =
      await this.intersolveVisaRequestRepository.save(interSolveLoadRequest);
    console.log(
      'BEFORE interSolveLoadRequestEntity: ',
      interSolveLoadRequestEntity,
    );

    const payload: IntersolveLoadDto = {
      reference: interSolveLoadRequestEntity.reference,
      saleId: interSolveLoadRequestEntity.saleId,
      quantities: [
        {
          quantity: {
            value: amountInCents,
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
          },
        },
      ],
    };
    const topUpResult = await this.intersolveVisaApiService.topUpCard(
      tokenCode,
      payload,
    );

    interSolveLoadRequestEntity.statusCode = topUpResult.status;
    await this.intersolveVisaRequestRepository.save(
      interSolveLoadRequestEntity,
    );
    console.log(
      'AFTER interSolveLoadRequestEntity: ',
      interSolveLoadRequestEntity,
    );

    return {
      status: topUpResult.data?.success ? StatusEnum.success : StatusEnum.error,
      message: topUpResult.data?.success
        ? null
        : topUpResult.data?.errors?.length
        ? `TOP UP ERROR: ${this.intersolveErrorToMessage(
            topUpResult.data?.errors,
          )}`
        : `TOP UP ERROR: ${topUpResult.status} - ${topUpResult.statusText}`,
    };
  }

  private async activateToken(tokenCode: string): Promise<any> {
    const intersolveVisaRequest = new IntersolveVisaRequestEntity();
    intersolveVisaRequest.reference = uuid();
    intersolveVisaRequest.metadata = JSON.parse(
      JSON.stringify({ tokenCode: tokenCode }),
    );
    intersolveVisaRequest.endpoint = IntersolveEndpoints.ACTIVATE;
    const intersolveVisaRequestEntity =
      await this.intersolveVisaRequestRepository.save(intersolveVisaRequest);
    console.log(
      'BEFORE intersolveVisaRequestEntity: ',
      intersolveVisaRequestEntity,
    );
    const payload: IntersolveActivateTokenRequestDto = {
      reference: intersolveVisaRequestEntity.reference,
    };
    const activateResult = await this.intersolveVisaApiService.activateToken(
      tokenCode,
      payload,
    );
    intersolveVisaRequestEntity.statusCode = activateResult.status;
    await this.intersolveVisaRequestRepository.save(
      intersolveVisaRequestEntity,
    );
    console.log(
      'AFTER intersolveVisaRequestEntity: ',
      intersolveVisaRequestEntity,
    );
  }

  private intersolveErrorToMessage(
    errors: IntersolveReponseErrorDto[],
  ): string {
    let allMessages = '';
    for (const [i, error] of errors.entries()) {
      const newLine = i < errors.length - 1 ? '\n' : '';
      console.log(`${error.code}: ${error.description} Field: ${error.field}`);
      allMessages = `${allMessages}${error.code}: ${error.description} Field: ${error.field}${newLine}`;
    }
    return allMessages;
  }
}
