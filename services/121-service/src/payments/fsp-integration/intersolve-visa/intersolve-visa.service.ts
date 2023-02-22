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
import { IntersolveCreateCustomerResponseBodyDto } from './dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import {
  IntersolveIssueTokenResponseBodyDto,
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
      if (getTokenResult.newCardMessage) {
        transactionNotifications.push(
          this.buildNotificationObjectIssueCard(getTokenResult.tokenCode),
        );
      }
    } else {
      const res = {
        referenceId: paymentData.referenceId,
        status: StatusEnum.error,
        message: getTokenResult.message,
        date: new Date(),
        calculatedAmount: calculatedAmount,
        fspName: FspName.intersolveVisa,
      };
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
  ): Promise<{
    success: boolean;
    newCardMessage?: boolean;
    tokenCode?: string;
    message?: string;
  }> {
    let newCardMessage = false;
    let visaCardEntity = await this.getExistingLinkedWallet(registration.id);
    if (!visaCardEntity) {
      const issueWalletTokenResult = await this.issueWalletToken(registration);
      if (issueWalletTokenResult.success) {
        visaCardEntity = issueWalletTokenResult.visaCard;
        newCardMessage = true;
      } else {
        return {
          success: false,
          message: issueWalletTokenResult.message,
        };
      }
    }
    if (!visaCardEntity.intersolveVisaCustomer) {
      const registerResult = await this.registerCustomerToWallet(
        registration,
        visaCardEntity.tokenCode,
      );
      if (!registerResult.success) {
        return {
          success: false,
          message: registerResult.message,
        };
      }
      await this.activateToken(
        visaCardEntity.tokenCode,
        registration.referenceId,
      );
      newCardMessage = true;
    }

    return {
      success: true,
      newCardMessage,
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

  private async issueWalletToken(registration: RegistrationEntity): Promise<{
    success: boolean;
    visaCard?: IntersolveVisaCardEntity;
    message?: string;
  }> {
    const visaCardNumber = await registration.getRegistrationDataValueByName(
      'visaCardNumber',
    );

    if (!visaCardNumber) {
      // There is no imported visa card number, so we need to issue a new one
      // TODO: THIS IS AN UNTESTED FLOW FOR DIGITAL VISACARD i/o PHYSICAL

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
      issueTokenRequestEntity.statusCode = issueTokenResult.status;
      await this.intersolveVisaRequestRepository.save(issueTokenRequestEntity);

      if (!issueTokenResult.data.success) {
        return {
          success: issueTokenResult.data.success,
          message: issueTokenResult.data.success
            ? null
            : `CARD CREATION ERROR: ${this.intersolveErrorToMessage(
                issueTokenResult.data.errors,
              )}`,
        };
      } else {
        await this.createIntersolveVisaEntities(registration, issueTokenResult);
        return {
          success: issueTokenResult.data.success,
          visaCard: await this.getWalletByTokenCode(
            issueTokenResult.data.data.token.code,
          ),
          message: issueTokenResult.data.success
            ? null
            : `CARD CREATION ERROR: ${this.intersolveErrorToMessage(
                issueTokenResult.data.errors,
              )}`,
        };
      }
    } else {
      // This scenario is the 1st Visa integration scenario where physical card numbers are imported via EspoCRM
      // There IS an imported visa card number, so we don't need to issue a new one but we need to create the entities
      const issueWalletTokenResult = new IntersolveIssueTokenResponseDto();
      issueWalletTokenResult.data = new IntersolveIssueTokenResponseBodyDto();
      issueWalletTokenResult.data.data =
        new IntersolveIssueTokenResponseDataDto();
      issueWalletTokenResult.data.data.token =
        new IntersolveIssueTokenResponseTokenDto();
      issueWalletTokenResult.data.success = true;
      issueWalletTokenResult.data.data.token.code = visaCardNumber;

      await this.createIntersolveVisaEntities(
        registration,
        issueWalletTokenResult,
      );
      const visaCard = await this.getWalletByTokenCode(
        issueWalletTokenResult.data.data.token.code,
      );
      return {
        success: issueWalletTokenResult.data.success,
        visaCard: visaCard,
      };
    }
  }

  private async createIntersolveVisaEntities(
    registration: RegistrationEntity,
    issueWalletTokenResult: IntersolveIssueTokenResponseDto,
  ): Promise<any> {
    const customerEntity = await this.intersolveVisaCustomerRepo.findOne({
      where: { registrationId: registration.id },
    });
    if (customerEntity) {
      const getCustomerResult = await this.intersolveVisaApiService.getCustomer(
        customerEntity.holderId,
      );
      if (getCustomerResult.data?.success) {
        console.log(
          'referenceId already exists with Intersolve > do not create again',
        );
      } else {
        const createCustomerResult = await this.createCustomer(registration);
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
        customerEntity.holderId = createCustomerResult.data.data.id;
        customerEntity.blocked = createCustomerResult.data.data.blocked;
        await this.intersolveVisaCustomerRepo.save(customerEntity);
      }
    } else {
      const createCustomerResult = await this.createCustomer(registration);
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
      const visaCustomer = new IntersolveVisaCustomerEntity();
      visaCustomer.registration = registration;
      visaCustomer.holderId = createCustomerResult.data.data.id;
      visaCustomer.blocked = createCustomerResult.data.data.blocked;
      await this.intersolveVisaCustomerRepo.save(visaCustomer);
    }

    let intersolveVisaCard = await this.intersolveVisaCardRepository.findOne({
      where: { tokenCode: issueWalletTokenResult.data.data.token.code },
    });

    if (!intersolveVisaCard) {
      intersolveVisaCard = new IntersolveVisaCardEntity();
      intersolveVisaCard.success = issueWalletTokenResult.data.success;
      intersolveVisaCard.tokenCode =
        issueWalletTokenResult.data.data.token.code;
      intersolveVisaCard.tokenBlocked =
        issueWalletTokenResult.data.data.token.blocked;
      intersolveVisaCard.expiresAt =
        issueWalletTokenResult.data.data.token.expiresAt;
      intersolveVisaCard.status = issueWalletTokenResult.data.data.token.status;

      await this.intersolveVisaCardRepository.save(intersolveVisaCard);
    }
  }

  private async registerCustomerToWallet(
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
        success: registerHolderResult.data?.success,
        message: registerHolderResult.data?.success
          ? null
          : `LINK CUSTOMER ERROR: ${registerHolderResult.data?.code}`,
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

  private async createCustomer(
    registration: RegistrationEntity,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
    const lastName = await registration.getRegistrationDataValueByName(
      'lastName',
    );
    const createCustomerRequest: IntersolveCreateCustomerDto = {
      externalReference: registration.referenceId,
      individual: {
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

  private async activateToken(
    tokenCode: string,
    referenceId: string,
  ): Promise<any> {
    const intersolveVisaRequest = new IntersolveVisaRequestEntity();
    intersolveVisaRequest.reference = uuid();
    intersolveVisaRequest.metadata = JSON.parse(
      JSON.stringify({ tokenCode: tokenCode }),
    );
    intersolveVisaRequest.saleId = referenceId;
    intersolveVisaRequest.endpoint = IntersolveEndpoints.ACTIVATE;
    const intersolveVisaRequestEntity =
      await this.intersolveVisaRequestRepository.save(intersolveVisaRequest);

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
