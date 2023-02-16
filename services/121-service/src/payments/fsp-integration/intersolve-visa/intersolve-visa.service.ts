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
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveReponseErrorDto } from './dto/intersolve-response-error.dto';
import { MessageStatus as MessageStatusDto } from './dto/message-status.dto';
import { IntersolveIssueTokenRequestEntity } from './intersolve-issue-token-request.entity';
import { IntersolveLoadRequestEntity } from './intersolve-load-request.entity';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaApiService } from './intersolve-visa.api.service';
import { IntersolveVisaCardEntity } from './inversolve-visa-card.entity';

@Injectable()
export class IntersolveVisaService {
  @InjectRepository(RegistrationEntity)
  public registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(IntersolveVisaCustomerEntity)
  public intersolveVisaCustomerRepo: Repository<IntersolveVisaCustomerEntity>;
  @InjectRepository(IntersolveVisaCardEntity)
  public intersolveVisaCardRepository: Repository<IntersolveVisaCardEntity>;
  @InjectRepository(IntersolveIssueTokenRequestEntity)
  public intersolveIssueTokenRequestRepository: Repository<IntersolveIssueTokenRequestEntity>;
  @InjectRepository(IntersolveLoadRequestEntity)
  public intersolveLoadRequestRepository: Repository<IntersolveLoadRequestEntity>;
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
    const getTokenResult = await this.getIssueWalletToken(registration);
    if (getTokenResult.succes) {
      transactionNotifications.push(
        this.buildNotificationObjectIssueCard(getTokenResult.tokenCode),
      );
    } else {
      return {
        referenceId: paymentData.referenceId,
        status: StatusEnum.error,
        message: getTokenResult.message,
        date: new Date(),
        calculatedAmount: calculatedAmount,
        fspName: FspName.intersolveVisa,
      };
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

  private async getExistingWalletTokenCode(
    registrationId: number,
  ): Promise<IntersolveVisaCardEntity> {
    // MAGICALLY INSERT THE CARD HERE WE ASSUME THAT ESPOCRM ALREADY INSERTED
    // THIS EARLIER WITH AN API CALL TO THE 121 SYSTEM
    const mockVisaCard = new IntersolveVisaCardEntity();
    mockVisaCard.tokenCode = '6375100999120000007'; // example number taken from the docs
    const mockSave = await this.intersolveVisaCardRepository.save(mockVisaCard);

    const mockIntersolveVisaCustomer = new IntersolveVisaCustomerEntity();
    mockIntersolveVisaCustomer.registrationId = registrationId;
    mockIntersolveVisaCustomer.visaCard = mockSave;
    await this.intersolveVisaCustomerRepo.save(mockIntersolveVisaCustomer);

    // END OF MAGIC

    const visaCustomer = await this.intersolveVisaCustomerRepo.findOne({
      where: { registrationId: registrationId },
      relations: ['visaCard', 'visaCard.intersolveVisaCustomer'],
    });
    console.log('visaCustomer: ', visaCustomer);
    if (visaCustomer && visaCustomer.visaCard) {
      return visaCustomer.visaCard;
    }
  }

  private async getIssueWalletToken(
    registration: RegistrationEntity,
  ): Promise<{ succes: boolean; tokenCode?: string; message?: string }> {
    let visaCardEntity = await this.getExistingWalletTokenCode(registration.id);
    if (!visaCardEntity) {
      const issueTokenResult = await this.issueToken(registration);
      if (issueTokenResult.succes) {
        visaCardEntity = issueTokenResult.visaCard;
      } else {
        return {
          succes: false,
          message: issueTokenResult.message,
        };
      }
    }

    if (!visaCardEntity.intersolveVisaCustomer.holderId) {
      const registerResult = await this.registerCustomerHolderToWallet(
        visaCardEntity.intersolveVisaCustomer,
        registration,
        visaCardEntity.tokenCode,
      );
      if (!registerResult.succes) {
        return {
          succes: false,
          message: registerResult.message,
        };
      }
    }

    return {
      succes: true,
      tokenCode: visaCardEntity.tokenCode,
    };
  }

  private async issueToken(registration: RegistrationEntity): Promise<{
    succes: boolean;
    visaCard?: IntersolveVisaCardEntity;
    message?: string;
  }> {
    const reference = uuid();
    const issueTokenRequest = {
      reference: reference,
      saleId: registration.referenceId,
    };
    const issueTokenRequestEntity =
      await this.intersolveIssueTokenRequestRepository.save(issueTokenRequest);
    const issueTokenResult = await this.intersolveVisaApiService.issueToken(
      issueTokenRequest,
    );
    console.log('issueTokenResult: ', issueTokenResult);
    // issueTokenRequestEntity.statusCode = issueTokenResult.statusCode;
    await this.intersolveIssueTokenRequestRepository.save(
      issueTokenRequestEntity,
    );

    if (!issueTokenResult.success) {
      return {
        succes: issueTokenResult.success,
        message: issueTokenResult.success
          ? null
          : `CARD CREATION ERROR: ${this.intersolveErrorToMessage(
              issueTokenResult.errors,
            )}`,
      };
    } else {
      const intersolveVisaCard = new IntersolveVisaCardEntity();
      const visaCustomer = new IntersolveVisaCustomerEntity();
      visaCustomer.registration = registration;
      intersolveVisaCard.intersolveVisaCustomer = visaCustomer;
      intersolveVisaCard.success = issueTokenResult.success;
      intersolveVisaCard.tokenCode = issueTokenResult.data.token.code;
      intersolveVisaCard.tokenBlocked = issueTokenResult.data.token.blocked;
      intersolveVisaCard.expiresAt = issueTokenResult.data.token.expiresAt;
      intersolveVisaCard.status = issueTokenResult.data.token.status;
      await this.intersolveVisaCardRepository.save(intersolveVisaCard);
      return {
        succes: issueTokenResult.success,
        visaCard: await this.getExistingWalletTokenCode(registration.id),
        message: issueTokenResult.success
          ? null
          : `CARD CREATION ERROR: ${this.intersolveErrorToMessage(
              issueTokenResult.errors,
            )}`,
      };
    }
  }

  private async registerCustomerHolderToWallet(
    customerEntity: IntersolveVisaCustomerEntity,
    registration: RegistrationEntity,
    tokenCode: string,
  ): Promise<{
    succes: boolean;
    holderId?: string;
    message?: string;
  }> {
    // MAYBE WE NEED TO SOLVE GETTING THE LASTNAME IN A LESS HARDCODED WAY
    const lastName = await registration.getRegistrationDataValueByName(
      'nameLast',
    );
    console.log('lastName: ', lastName);
    const createCustomerRequest: IntersolveCreateCustomerDto = {
      externalReference: registration.referenceId,
      individual: {
        firstName: 'test',
        lastName: lastName,
        middleName: '',
        initials: 'F',
        gender: 'MALE',
        dateOfBirth: '1970-01-01',
        countryOfBirth: 'NL',
        nationality: 'NL',
        culture: 'nl-NL',
        estimatedAnnualPaymentVolumeMajorUnit: 1000,
      },
      contactInfo: {
        addresses: [],
        emailAddresses: [],
        phoneNumbers: [],
      },
    };
    const createCustomerResult =
      await this.intersolveVisaApiService.createCustomer(createCustomerRequest);
    console.log('createCustomerResult: ', createCustomerResult);
    if (!createCustomerResult.success) {
      return {
        succes: createCustomerResult.success,
        message: createCustomerResult.success
          ? null
          : `CREATE CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              createCustomerResult.errors,
            )}`,
      };
    }

    const registerHolderResult =
      await this.intersolveVisaApiService.registerHolder(
        {
          holderId: createCustomerResult.data.id,
        },
        tokenCode,
      );
    if (!registerHolderResult.success) {
      return {
        succes: registerHolderResult.success,
        message: registerHolderResult.success
          ? null
          : `LINK CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              registerHolderResult.errors,
            )}`,
      };
    }

    customerEntity.holderId = createCustomerResult.data.id;
    customerEntity.blocked = createCustomerResult.data.blocked;
    await this.intersolveVisaCustomerRepo.save(customerEntity);
    return {
      succes: true,
      holderId: createCustomerResult.data.id,
    };
  }

  private async topUpVisaCard(
    tokenCode: string,
    calculatedAmount: number,
    referenceId: string,
    payment: number,
  ): Promise<MessageStatusDto> {
    const amountInCents = calculatedAmount * 100;
    const interSolveLoadRequest = new IntersolveLoadRequestEntity();
    interSolveLoadRequest.tokenCode = tokenCode;
    interSolveLoadRequest.quantityValue = amountInCents;
    interSolveLoadRequest.reference = uuid();
    interSolveLoadRequest.saleId = `${referenceId}-${payment}`;
    const interSolveLoadRequestEntity =
      await this.intersolveLoadRequestRepository.save(interSolveLoadRequest);

    const payload: IntersolveLoadDto = {
      reference: interSolveLoadRequestEntity.reference,
      saleId: interSolveLoadRequestEntity.saleId,
      quantities: [
        {
          quantity: {
            value: amountInCents, // We thinks this needs to be in cents
            assetCode: 'NEED TO GET THIS FROM INTERSOLVE',
          },
        },
      ],
    };
    const topUpResult = await this.intersolveVisaApiService.topUpCard(
      tokenCode,
      payload,
    );

    interSolveLoadRequestEntity.statusCode = topUpResult.statusCode;
    await this.intersolveLoadRequestRepository.save(
      interSolveLoadRequestEntity,
    );

    return {
      status: topUpResult.body.success ? StatusEnum.success : StatusEnum.error,
      message: topUpResult.body.success
        ? null
        : `TOP UP ERROR: ${this.intersolveErrorToMessage(
            topUpResult.body.errors,
          )}`,
    };
  }

  private intersolveErrorToMessage(
    errors: IntersolveReponseErrorDto[],
  ): string {
    let allMessages = '';
    for (const [i, error] of errors.entries()) {
      const newLine = i < errors.length - 1 ? '\n' : '';
      allMessages = `${allMessages}${error.code}: ${error.description} Field: ${error.field}${newLine}`;
    }
    return allMessages;
  }
}
