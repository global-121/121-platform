import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
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
  IntersolveIssueTokenResponseDto,
  IntersolveIssueTokenResponseTokenDto,
} from './dto/intersolve-issue-token-response.dto';
import { IntersolveIssueTokenDto } from './dto/intersolve-issue-token.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveReponseErrorDto } from './dto/intersolve-response-error.dto';
import { MessageStatus as MessageStatusDto } from './dto/message-status.dto';
import { IntersolveVisaTokenStatus } from './enum/intersolve-visa-token-status.enum';
import { IntersolveVisaCardEntity } from './intersolve-visa-card.entity';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaRequestEntity } from './intersolve-visa-request.entity';
import {
  IntersolveVisaApiService,
  IntersolveVisaEndpoints,
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
    const getTokenResult = await this.getOrIssueToken(registration);
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

  private async getOrIssueToken(registration: RegistrationEntity): Promise<{
    success: boolean;
    newCardMessage?: boolean;
    tokenCode?: string;
    message?: string;
  }> {
    let newCardMessage = false;
    let visaCardEntity = await this.getExistingLinkedWallet(registration.id);
    if (!visaCardEntity) {
      const issueTokenResult = await this.issueToken(registration);
      if (issueTokenResult.success) {
        visaCardEntity = issueTokenResult.visaCard;
        newCardMessage = true;
      } else {
        return {
          success: false,
          message: issueTokenResult.message,
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
      if (visaCardEntity.status === IntersolveVisaTokenStatus.INACTIVE) {
        const activateResult = await this.activateToken(
          visaCardEntity.tokenCode,
          registration.referenceId,
        );
        if (!activateResult.success) {
          return activateResult;
        }
      }
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

  private async issueToken(registration: RegistrationEntity): Promise<{
    success: boolean;
    visaCard?: IntersolveVisaCardEntity;
    message?: string;
  }> {
    const tokenCode = await registration.getRegistrationDataValueByName(
      'visaTokenCode',
    );

    if (!tokenCode) {
      // There is no imported visa card number, so we need to issue a new one
      // TODO: THIS IS AN UNTESTED FLOW FOR DIGITAL VISACARD i/o PHYSICAL
      const reference = uuid();
      const issueTokenRequest = new IntersolveVisaRequestEntity();
      issueTokenRequest.reference = reference;
      issueTokenRequest.saleId = registration.referenceId;
      issueTokenRequest.endpoint = IntersolveVisaEndpoints.ISSUE_TOKEN;
      const issueTokenRequestEntity =
        await this.intersolveVisaRequestRepository.save(issueTokenRequest);

      const issueTokenPayload = new IntersolveIssueTokenDto();
      issueTokenPayload.holderId = null;
      const issueTokenResult = await this.intersolveVisaApiService.issueToken(
        issueTokenPayload,
      );
      issueTokenRequestEntity.statusCode = issueTokenResult.status;
      await this.intersolveVisaRequestRepository.save(issueTokenRequestEntity);

      if (!issueTokenResult.data.success) {
        return {
          success: false,
          message: issueTokenResult.data.errors.length
            ? `CARD CREATION ERROR: ${this.intersolveErrorToMessage(
                issueTokenResult.data.errors,
              )}`
            : `CARD CREATION ERROR: ${issueTokenResult.status} - ${issueTokenResult.statusText}`,
        };
      } else {
        const createEntitiesResult = await this.createIntersolveVisaEntities(
          registration,
          issueTokenResult,
        );
        if (!createEntitiesResult.success) {
          return {
            success: false,
            message: createEntitiesResult.message,
          };
        }
        return {
          success: issueTokenResult.data.success,
          visaCard: await this.getWalletByTokenCode(
            issueTokenResult.data.data.code,
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
      const issueTokenResult = new IntersolveIssueTokenResponseDto();
      issueTokenResult.data = new IntersolveIssueTokenResponseBodyDto();
      issueTokenResult.data.data = new IntersolveIssueTokenResponseTokenDto();
      issueTokenResult.data.success = true;
      issueTokenResult.data.data.code = tokenCode;
      issueTokenResult.data.data.type = 'STANDARD'; // Intersolve-type for physical card

      const createEntitiesResult = await this.createIntersolveVisaEntities(
        registration,
        issueTokenResult,
      );
      if (!createEntitiesResult.success) {
        return {
          success: false,
          message: createEntitiesResult.message,
        };
      }
      const visaCard = await this.getWalletByTokenCode(
        issueTokenResult.data.data.code,
      );
      return {
        success: issueTokenResult.data.success,
        visaCard: visaCard,
      };
    }
  }

  private async createIntersolveVisaEntities(
    registration: RegistrationEntity,
    issueTokenResult: IntersolveIssueTokenResponseDto,
  ): Promise<{ success: boolean; message?: string }> {
    const customerEntity = await this.intersolveVisaCustomerRepo.findOne({
      where: { registrationId: registration.id },
    });
    if (customerEntity) {
      const getCustomerResult = await this.intersolveVisaApiService.getCustomer(
        customerEntity.holderId,
      );
      if (getCustomerResult.data?.success) {
        // TODO: refactor this if-construction
        console.log(
          'referenceId already exists with Intersolve > do not create again',
        );
      } else {
        const createCustomerResult = await this.createCustomer(registration);
        if (!createCustomerResult.data.success) {
          return {
            success: false,
            message: createCustomerResult.data.errors.length
              ? `CREATE CUSTOMER ERROR: ${this.intersolveErrorToMessage(
                  createCustomerResult.data.errors,
                )}`
              : `CREATE CUSTOMER ERROR: ${createCustomerResult.status} - ${createCustomerResult.statusText}`,
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
          success: false,
          message: createCustomerResult.data.errors.length
            ? `CREATE CUSTOMER ERROR: ${this.intersolveErrorToMessage(
                createCustomerResult.data.errors,
              )}`
            : `CREATE CUSTOMER ERROR: ${createCustomerResult.status} - ${createCustomerResult.statusText}`,
        };
      }
      const visaCustomer = new IntersolveVisaCustomerEntity();
      visaCustomer.registration = registration;
      visaCustomer.holderId = createCustomerResult.data.data.id;
      visaCustomer.blocked = createCustomerResult.data.data.blocked;
      await this.intersolveVisaCustomerRepo.save(visaCustomer);
    }

    let intersolveVisaCard = await this.intersolveVisaCardRepository.findOne({
      where: { tokenCode: issueTokenResult.data.data.code },
    });

    if (!intersolveVisaCard) {
      intersolveVisaCard = new IntersolveVisaCardEntity();
      intersolveVisaCard.success = issueTokenResult.data.success;
      intersolveVisaCard.tokenCode = issueTokenResult.data.data.code;
      intersolveVisaCard.tokenBlocked = issueTokenResult.data.data.blocked;
      intersolveVisaCard.expiresAt = issueTokenResult.data.data.expiresAt;
      intersolveVisaCard.status = issueTokenResult.data.data.status;
      intersolveVisaCard.type = issueTokenResult.data.data.type;

      await this.intersolveVisaCardRepository.save(intersolveVisaCard);
    }
    return {
      success: true,
    };
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
        success: false,
        message: registerHolderResult.data.errors.length
          ? `LINK CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              registerHolderResult.data.errors,
            )}`
          : `LINK CUSTOMER ERROR: ${registerHolderResult.status} - ${registerHolderResult.statusText}`,
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
    interSolveLoadRequest.endpoint = IntersolveVisaEndpoints.LOAD;
    interSolveLoadRequest.saleId = `${referenceId}-${payment}`;
    interSolveLoadRequest.metadata = JSON.parse(
      JSON.stringify({ tokenCode: tokenCode, quantityValue: amountInCents }),
    );
    // TODO: Why save already here?
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
  ): Promise<{ success: boolean; message?: string }> {
    const intersolveVisaRequest = new IntersolveVisaRequestEntity();
    intersolveVisaRequest.reference = uuid();
    intersolveVisaRequest.metadata = JSON.parse(
      JSON.stringify({ tokenCode: tokenCode }),
    );
    intersolveVisaRequest.saleId = referenceId;
    intersolveVisaRequest.endpoint = IntersolveVisaEndpoints.ACTIVATE;
    const intersolveVisaRequestEntity =
      await this.intersolveVisaRequestRepository.save(intersolveVisaRequest);

    const payload: IntersolveActivateTokenRequestDto = {
      reference: intersolveVisaRequestEntity.reference,
    };
    const activateResult = await this.intersolveVisaApiService.activateToken(
      tokenCode,
      payload,
    );
    if (!activateResult.data?.success) {
      return {
        success: false,
        message: activateResult.data?.errors?.length
          ? `ACTIVATE CARD ERROR: ${this.intersolveErrorToMessage(
              activateResult.data?.errors,
            )}`
          : `ACTIVATE CARD ERROR: ${activateResult.status} - ${activateResult.statusText}`,
      };
    }
    intersolveVisaRequestEntity.statusCode = activateResult.status;
    await this.intersolveVisaRequestRepository.save(
      intersolveVisaRequestEntity,
    );
    return {
      success: true,
    };
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
