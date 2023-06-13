import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { RegistrationDataOptions } from '../../../registration/dto/registration-data-relation.model';
import { GenericAttributes } from '../../../registration/enum/custom-data-attributes';
import { RegistrationsService } from '../../../registration/registrations.service';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '../../dto/payment-transaction-result.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { RegistrationEntity } from './../../../registration/registration.entity';
import { IntersolveCreateCustomerResponseBodyDto } from './dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import { IntersolveCreateDebitCardDto } from './dto/intersolve-create-debit-card.dto';
import { IntersolveIssueTokenDto } from './dto/intersolve-issue-token.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveReponseErrorDto } from './dto/intersolve-response-error.dto';
import { MessageStatus as MessageStatusDto } from './dto/message-status.dto';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { IntersolveVisaPaymentInfoEnum } from './enum/intersolve-visa-payment-info.enum';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';
import { IntersolveVisaApiService } from './intersolve-visa.api.service';

@Injectable()
export class IntersolveVisaService {
  @InjectRepository(RegistrationEntity)
  public registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(IntersolveVisaCustomerEntity)
  public intersolveVisaCustomerRepo: Repository<IntersolveVisaCustomerEntity>;
  @InjectRepository(IntersolveVisaWalletEntity)
  public intersolveVisaWalletRepository: Repository<IntersolveVisaWalletEntity>;
  public constructor(
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<void> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.intersolveVisa;

    const paymentDetailsArray = await this.getPaPaymentDetails(
      paymentList.map((pa) => pa.referenceId),
    );

    for (const paymentDetails of paymentDetailsArray) {
      const calculatedAmount =
        amount * (paymentDetails.paymentAmountMultiplier || 1);

      const paymentRequestResultPerPa = await this.sendPaymentToPa(
        paymentDetails,
        paymentNr,
        calculatedAmount,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
      await this.transactionsService.storeTransactionUpdateStatus(
        paymentRequestResultPerPa,
        programId,
        paymentNr,
      );
    }
  }

  private async getPaPaymentDetails(
    referenceIds: string[],
  ): Promise<PaymentDetailsDto[]> {
    const relationOptions = await this.getRelationOptionsForVisa(
      referenceIds[0],
    );
    const query = this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        `registration.referenceId as "referenceId"`,
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

  private async getRelationOptionsForVisa(
    referenceId: string,
  ): Promise<RegistrationDataOptions[]> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
    });
    const registrationDataOptions: RegistrationDataOptions[] = [];
    for (const attr of Object.values(IntersolveVisaPaymentInfoEnum)) {
      const relation = await registration.getRelationForName(attr);
      const registrationDataOption = {
        name: attr,
        relation: relation,
      };
      registrationDataOptions.push(registrationDataOption);
    }
    return registrationDataOptions;
  }

  private async sendPaymentToPa(
    paymentDetails: PaymentDetailsDto,
    paymentNr: number,
    calculatedAmount: number,
  ): Promise<PaTransactionResultDto> {
    const response = new PaTransactionResultDto();
    response.referenceId = paymentDetails.referenceId;
    response.date = new Date();
    response.calculatedAmount = calculatedAmount;
    response.fspName = FspName.intersolveVisa;

    let transactionNotifications = [];
    let tokenCode;

    const registration = await this.registrationRepository.findOne({
      where: { referenceId: paymentDetails.referenceId },
    });
    const customer = await this.getCustomerEntity(registration.id);

    // Check if customer is in our database
    if (customer) {
      // Customer exists, check if visaWallets exists
      if (customer.visaWallet) {
        if (customer.visaWallet.linkedToVisaCustomer === false) {
          // Wallet exists, but is not linked to customer
          const registerResult = await this.linkWalletToCustomer(
            tokenCode,
            customer,
          );
          if (!registerResult.success) {
            response.status = StatusEnum.error;
            response.message = registerResult.message;
            return response;
          }
        }
      } else {
        // start create wallet flow (this also includes linking the wallet to the customer)
        const createWalletResult = await this.createWallet(
          registration,
          customer,
          response,
          calculatedAmount,
          transactionNotifications,
          paymentDetails,
        );
        if (createWalletResult.response?.status === StatusEnum.error) {
          response.status = response.status;
          response.message = response.message;
          return response;
        }
      }
    } else {
      // create customer (this assumes a customer with 121's referenceId does not exist yet with Intersolve)
      const createCustomerResult = await this.createCustomer(
        registration,
        paymentDetails,
      );
      if (!createCustomerResult.data.success) {
        response.status = StatusEnum.error;
        response.message = createCustomerResult.data.errors.length
          ? `CREATE CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              createCustomerResult.data.errors,
            )}`
          : `CREATE CUSTOMER ERROR: ${createCustomerResult.status} - ${createCustomerResult.statusText}`;
        return response;
      }

      // store customer
      const visaCustomer = new IntersolveVisaCustomerEntity();
      visaCustomer.registration = registration;
      visaCustomer.holderId = createCustomerResult.data.data.id;
      visaCustomer.blocked = createCustomerResult.data.data.blocked;
      await this.intersolveVisaCustomerRepo.save(visaCustomer);

      // start create wallet flow
      const createWalletResult = await this.createWallet(
        registration,
        visaCustomer,
        response,
        calculatedAmount,
        transactionNotifications,
        paymentDetails,
      );

      if (createWalletResult.response?.status === StatusEnum.error) {
        response.status = response.status;
        response.message = response.message;
        return response;
      }
      tokenCode = createWalletResult.tokenCode;
      transactionNotifications = createWalletResult.transactionNotifications;
    }

    const loadBalanceResult = await this.loadBalanceVisaCard(
      tokenCode,
      calculatedAmount,
      registration.referenceId,
      paymentNr,
    );
    transactionNotifications.push(
      this.buildNotificationObjectLoadBalance(calculatedAmount),
    );
    return {
      referenceId: paymentDetails.referenceId,
      status: loadBalanceResult.status,
      message: loadBalanceResult.message,
      date: new Date(),
      calculatedAmount: calculatedAmount,
      fspName: FspName.intersolveVisa,
      notificationObjects: transactionNotifications,
    };
  }

  private async createWallet(
    registration: RegistrationEntity,
    visaCustomer: IntersolveVisaCustomerEntity,
    response: PaTransactionResultDto,
    calculatedAmount: number,
    transactionNotifications: any[],
    paymentDetails: PaymentDetailsDto,
  ): Promise<{
    response?: PaTransactionResultDto;
    tokenCode?: string;
    transactionNotifications?: any[];
  }> {
    let tokenCode = '';
    // TODO: Issue token
    const issueTokenPayload = new IntersolveIssueTokenDto();
    issueTokenPayload.reference = visaCustomer.holderId;
    issueTokenPayload.quantities = [
      { quantity: { assetCode: 'EUR', value: calculatedAmount } },
    ];
    // TODO: remove console.log
    console.log('issueTokenPayload: ', issueTokenPayload);
    const issueTokenResult = await this.intersolveVisaApiService.issueToken(
      issueTokenPayload,
    );
    // TODO: remove console.log
    console.log('issueTokenResult: ', issueTokenResult);

    if (!issueTokenResult.data?.success) {
      response.status = StatusEnum.error;
      response.message = issueTokenResult.data?.errors?.length
        ? `ISSUE TOKEN ERROR: ${this.intersolveErrorToMessage(
            issueTokenResult.data.errors,
          )}`
        : `ISSUE TOKEN ERROR: ${issueTokenResult.status} - ${issueTokenResult.statusText}`;
      return { response };
    }

    // store wallet data
    const intersolveVisaWallet = new IntersolveVisaWalletEntity();
    intersolveVisaWallet.tokenCode = issueTokenResult.data.data.code;
    intersolveVisaWallet.tokenBlocked = issueTokenResult.data.data.blocked;
    intersolveVisaWallet.intersolveVisaCustomer = visaCustomer;
    await this.intersolveVisaWalletRepository.save(intersolveVisaWallet);
    tokenCode = issueTokenResult.data.data.code;

    // TODO: Link to customer
    const registerResult = await this.linkWalletToCustomer(
      tokenCode,
      visaCustomer,
    );
    if (!registerResult.success) {
      response.status = StatusEnum.error;
      response.message = registerResult.message;
      return { response };
    }

    // Update IntersolveVisaWallet set linkedToVisaCustomer to true
    intersolveVisaWallet.linkedToVisaCustomer = true;
    await this.intersolveVisaWalletRepository.save(intersolveVisaWallet);

    const createDebitCardPayload = new IntersolveCreateDebitCardDto();
    createDebitCardPayload.brand = 'VISA_CARD';
    createDebitCardPayload.firstName = paymentDetails.firstName;
    createDebitCardPayload.lastName = paymentDetails.lastName;
    createDebitCardPayload.mobileNumber = paymentDetails.phoneNumber;
    createDebitCardPayload.cardAddress = {
      address1: `${
        paymentDetails.addressStreet +
        paymentDetails.addressHouseNumber +
        paymentDetails.addressHouseNumberAddition
      }`,
      city: paymentDetails.addressCity,
      country: 'NL',
      postalCode: paymentDetails.addressPostalCode,
    };
    createDebitCardPayload.pinAddress = {
      address1: `${
        paymentDetails.addressStreet +
        paymentDetails.addressHouseNumber +
        paymentDetails.addressHouseNumberAddition
      }`,
      city: paymentDetails.addressCity,
      country: 'NL',
      postalCode: paymentDetails.addressPostalCode,
    };
    const createDebitCardResult =
      await this.intersolveVisaApiService.createDebitCard(
        intersolveVisaWallet.tokenCode,
        createDebitCardPayload,
      );
    if (createDebitCardResult.status !== 200) {
      response.status = StatusEnum.error;
      response.message = createDebitCardResult.data?.errors?.length
        ? `CREATE DEBIT CARD ERROR: ${this.intersolveErrorToMessage(
            createDebitCardResult.data.errors,
          )}`
        : `CREATE DEBIT CARD ERROR: ${createDebitCardResult.status} - ${createDebitCardResult.statusText}`;
      return { response };
    }

    // Update IntersolveVisaWallet set debitCardCreated to true
    intersolveVisaWallet.debitCardCreated = true;
    await this.intersolveVisaWalletRepository.save(intersolveVisaWallet);

    // add message for 'created debit card'
    transactionNotifications.push(
      this.buildNotificationObjectIssueDebitCard(tokenCode, calculatedAmount),
    );
    return { tokenCode, transactionNotifications };
  }

  private async getCustomerEntity(
    registrationId: number,
  ): Promise<IntersolveVisaCustomerEntity> {
    return await this.intersolveVisaCustomerRepo.findOne({
      relations: ['visaWallet'],
      where: { registrationId: registrationId },
    });
  }

  private buildNotificationObjectIssueDebitCard(
    token: string,
    calculatedAmount: number,
  ): TransactionNotificationObject {
    return {
      notificationKey: 'visaDebitCardCreated',
      dynamicContent: [token, String(calculatedAmount)],
    };
  }

  private buildNotificationObjectLoadBalance(
    amount: number,
  ): TransactionNotificationObject {
    return {
      notificationKey: 'visaLoad',
      dynamicContent: [String(amount)],
    };
  }

  private async linkWalletToCustomer(
    tokenCode: string,
    customerEntity: IntersolveVisaCustomerEntity,
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    const registerHolderResult =
      await this.intersolveVisaApiService.registerHolder(
        {
          holderId: customerEntity.holderId,
        },
        tokenCode,
      );

    if (registerHolderResult.status !== 204) {
      return {
        success: false,
        message: registerHolderResult.data?.errors?.length
          ? `LINK CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              registerHolderResult.data.errors,
            )}`
          : registerHolderResult.data?.code ||
            `LINK CUSTOMER ERROR: ${registerHolderResult.status} - ${registerHolderResult.statusText}`,
      };
    }

    return {
      success: true,
    };
  }

  private async createCustomer(
    registration: RegistrationEntity,
    paymentDetails: PaymentDetailsDto,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
    const createCustomerRequest: IntersolveCreateCustomerDto = {
      externalReference: registration.referenceId,
      individual: {
        lastName: paymentDetails.lastName,
        estimatedAnnualPaymentVolumeMajorUnit: 12 * 44, // This is assuming 44 euro per month for a year for 1 child
      },
      contactInfo: {
        addresses: [
          {
            type: 'HOME',
            addressLine1: `${
              paymentDetails.addressStreet +
              paymentDetails.addressHouseNumber +
              paymentDetails.addressHouseNumberAddition
            }`,
            // region: 'Utrecht',
            city: paymentDetails.addressCity,
            postalCode: paymentDetails.addressPostalCode,
            country: 'NL',
          },
        ],
        phoneNumbers: [
          {
            type: 'HOME',
            value: paymentDetails.phoneNumber,
          },
        ],
      },
    };
    return await this.intersolveVisaApiService.createCustomer(
      createCustomerRequest,
    );
  }

  private async loadBalanceVisaCard(
    tokenCode: string,
    calculatedAmount: number,
    referenceId: string,
    payment: number,
  ): Promise<MessageStatusDto> {
    const amountInCents = calculatedAmount * 100;
    const reference = uuid();
    const saleId = `${referenceId}-${payment}`;

    const payload: IntersolveLoadDto = {
      reference: reference,
      saleId: saleId,
      quantities: [
        {
          quantity: {
            value: amountInCents,
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
          },
        },
      ],
    };
    const loadBalanceResult =
      await this.intersolveVisaApiService.loadBalanceCard(tokenCode, payload);

    return {
      status: loadBalanceResult.data?.success
        ? StatusEnum.success
        : StatusEnum.error,
      message: loadBalanceResult.data?.success
        ? null
        : loadBalanceResult.data?.errors?.length
        ? `LOAD BALANCE ERROR: ${this.intersolveErrorToMessage(
            loadBalanceResult.data?.errors,
          )}`
        : `LOAD BALANCE ERROR: ${loadBalanceResult.status} - ${loadBalanceResult.statusText}`,
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
