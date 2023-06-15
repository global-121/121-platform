import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { ProgramEntity } from '../../../programs/program.entity';
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
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { RegistrationEntity } from './../../../registration/registration.entity';
import {
  IntersolveCreateCustomerResponseBodyDto,
  IntersolveLinkWalletCustomerResponseDto,
} from './dto/intersolve-create-customer-response.dto';
import { IntersolveCreateCustomerDto } from './dto/intersolve-create-customer.dto';
import {
  IntersolveCreateDebitCardDto,
  IntersolveCreateDebitCardResponseDto,
} from './dto/intersolve-create-debit-card.dto';
import { IntersolveCreateWalletResponseDto } from './dto/intersolve-create-wallet-response.dto';
import { IntersolveCreateWalletDto } from './dto/intersolve-create-wallet.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveReponseErrorDto } from './dto/intersolve-response-error.dto';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { IntersolveVisaPaymentInfoEnum } from './enum/intersolve-visa-payment-info.enum';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';
import { IntersolveVisaApiService } from './intersolve-visa.api.service';

@Injectable()
export class IntersolveVisaService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(RegistrationEntity)
  public registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(IntersolveVisaCustomerEntity)
  public intersolveVisaCustomerRepo: Repository<IntersolveVisaCustomerEntity>;
  @InjectRepository(IntersolveVisaWalletEntity)
  public intersolveVisaWalletRepository: Repository<IntersolveVisaWalletEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;
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

    const program = await this.programRepository.findOne({
      where: { id: programId },
    });

    for (const paymentDetails of paymentDetailsArray) {
      const calculatedAmount =
        amount * (paymentDetails.paymentAmountMultiplier || 1);

      const paymentRequestResultPerPa = await this.sendPaymentToPa(
        paymentDetails,
        paymentNr,
        calculatedAmount,
        program.endDate,
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

    const visaAddressInfoDtoArray = await query.getRawMany();
    return visaAddressInfoDtoArray;
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
    programEndDate: Date,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.referenceId = paymentDetails.referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = calculatedAmount;
    paTransactionResult.fspName = FspName.intersolveVisa;

    const transactionNotifications = [];

    const registration = await this.registrationRepository.findOne({
      where: { referenceId: paymentDetails.referenceId },
    });
    let visaCustomer = await this.getCustomerEntity(registration.id);

    // Check if customer exists
    if (!visaCustomer) {
      // If not, create customer
      const createCustomerResult = await this.createCustomer(
        registration.referenceId,
        paymentDetails,
      );

      // if error, return error
      if (!createCustomerResult.data.success) {
        paTransactionResult.status = StatusEnum.error;
        paTransactionResult.message = createCustomerResult.data.errors.length
          ? `CREATE CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              createCustomerResult.data.errors,
            )}`
          : `CREATE CUSTOMER ERROR: ${createCustomerResult.status} - ${createCustomerResult.statusText}`;
        return paTransactionResult;
      }

      // if success, store customer
      visaCustomer = new IntersolveVisaCustomerEntity();
      visaCustomer.registration = registration;
      visaCustomer.holderId = createCustomerResult.data.data.id;
      visaCustomer.blocked = createCustomerResult.data.data.blocked;
      await this.intersolveVisaCustomerRepo.save(visaCustomer);
    }

    // Check if wallet exists
    if (!visaCustomer.visaWallet) {
      // If not, create wallet
      const createWalletResult = await this.createWallet(
        visaCustomer,
        calculatedAmount,
        programEndDate,
      );

      // if error, return error
      if (!createWalletResult.data?.success) {
        paTransactionResult.status = StatusEnum.error;
        paTransactionResult.message = createWalletResult.data?.errors?.length
          ? `CREATE WALLET ERROR: ${this.intersolveErrorToMessage(
              createWalletResult.data.errors,
            )}`
          : `CREATE WALLET ERROR: ${createWalletResult.status} - ${createWalletResult.statusText}`;
        return paTransactionResult;
      }

      // if success, store wallet
      const intersolveVisaWallet = new IntersolveVisaWalletEntity();
      intersolveVisaWallet.tokenCode = createWalletResult.data.data.token.code;
      intersolveVisaWallet.tokenBlocked =
        createWalletResult.data.data.token.blocked;
      intersolveVisaWallet.intersolveVisaCustomer = visaCustomer;
      await this.intersolveVisaWalletRepository.save(intersolveVisaWallet);

      // TO DO: is this needed like this?
      visaCustomer.visaWallet = intersolveVisaWallet;
    }

    // Check if wallet is linked to customer
    if (!visaCustomer.visaWallet.linkedToVisaCustomer) {
      // if not, link wallet to customer
      const registerResult = await this.linkWalletToCustomer(visaCustomer);

      // if error, return error
      if (registerResult.status !== 204) {
        paTransactionResult.status = StatusEnum.error;
        paTransactionResult.message = registerResult.data?.errors?.length
          ? `LINK CUSTOMER ERROR: ${this.intersolveErrorToMessage(
              registerResult.data.errors,
            )}`
          : registerResult.data?.code ||
            `LINK CUSTOMER ERROR: ${registerResult.status} - ${registerResult.statusText}`;
        return paTransactionResult;
      }

      // if succes, update wallet: set linkedToVisaCustomer to true
      visaCustomer.visaWallet.linkedToVisaCustomer = true;
      await this.intersolveVisaWalletRepository.save(visaCustomer.visaWallet);
    }

    // Check if debit card is created
    if (!visaCustomer.visaWallet.debitCardCreated) {
      // If not, create debit card
      const createDebitCardResult = await this.createDebitCard(
        paymentDetails,
        visaCustomer.visaWallet,
      );

      // error or success: set transaction result either way
      paTransactionResult.status =
        createDebitCardResult.status === 200
          ? StatusEnum.success
          : StatusEnum.error;
      paTransactionResult.message =
        createDebitCardResult.status === 200
          ? null
          : createDebitCardResult.data?.errors?.length
          ? `CREATE DEBIT CARD ERROR: ${this.intersolveErrorToMessage(
              createDebitCardResult.data?.errors,
            )}`
          : `CREATE DEBIT CARD ERROR: ${createDebitCardResult.status} - ${createDebitCardResult.statusText}`;

      // if success, update wallet: set debitCardCreated to true ..
      if (paTransactionResult.status === StatusEnum.success) {
        visaCustomer.visaWallet.debitCardCreated = true;
        await this.intersolveVisaWalletRepository.save(visaCustomer.visaWallet);

        // .. and add 'debit card created' notification
        transactionNotifications.push(
          this.buildNotificationObjectIssueDebitCard(calculatedAmount),
        );
      }
    } else {
      // If yes, load balance
      const loadBalanceResult = await this.loadBalanceVisaCard(
        visaCustomer.visaWallet.tokenCode,
        calculatedAmount,
        registration.referenceId,
        paymentNr,
        programEndDate,
      );

      paTransactionResult.status = loadBalanceResult.data?.success
        ? StatusEnum.success
        : StatusEnum.error;
      paTransactionResult.message = loadBalanceResult.data?.success
        ? null
        : loadBalanceResult.data?.errors?.length
        ? `LOAD BALANCE ERROR: ${this.intersolveErrorToMessage(
            loadBalanceResult.data?.errors,
          )}`
        : `LOAD BALANCE ERROR: ${loadBalanceResult.status} - ${loadBalanceResult.statusText}`;

      transactionNotifications.push(
        this.buildNotificationObjectLoadBalance(calculatedAmount),
      );
    }

    paTransactionResult.notificationObjects = transactionNotifications;
    return paTransactionResult;
  }

  private async getCustomerEntity(
    registrationId: number,
  ): Promise<IntersolveVisaCustomerEntity> {
    return await this.intersolveVisaCustomerRepo.findOne({
      relations: ['visaWallet'],
      where: { registrationId: registrationId },
    });
  }

  private async createCustomer(
    referenceId: string,
    paymentDetails: PaymentDetailsDto,
  ): Promise<IntersolveCreateCustomerResponseBodyDto> {
    const createCustomerRequest: IntersolveCreateCustomerDto = {
      externalReference: referenceId,
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

  private async createWallet(
    visaCustomer: IntersolveVisaCustomerEntity,
    calculatedAmount: number,
    programEndDate: Date,
  ): Promise<IntersolveCreateWalletResponseDto> {
    const amountInCents = calculatedAmount * 100;
    const createWalletPayload = new IntersolveCreateWalletDto();
    createWalletPayload.reference = visaCustomer.holderId;
    createWalletPayload.quantities = [
      {
        quantity: { assetCode: 'EUR', value: amountInCents },
        expiresAt: programEndDate.toISOString(),
      },
    ];
    const createWalletResult = await this.intersolveVisaApiService.createWallet(
      createWalletPayload,
    );
    return createWalletResult;
  }

  private async linkWalletToCustomer(
    customerEntity: IntersolveVisaCustomerEntity,
  ): Promise<IntersolveLinkWalletCustomerResponseDto> {
    return await this.intersolveVisaApiService.linkCustomerToWallet(
      {
        holderId: customerEntity.holderId,
      },
      customerEntity.visaWallet.tokenCode,
    );
  }

  private async createDebitCard(
    paymentDetails: PaymentDetailsDto,
    intersolveVisaWallet: IntersolveVisaWalletEntity,
  ): Promise<IntersolveCreateDebitCardResponseDto> {
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
    return await this.intersolveVisaApiService.createDebitCard(
      intersolveVisaWallet.tokenCode,
      createDebitCardPayload,
    );
  }

  private buildNotificationObjectIssueDebitCard(
    amount: number,
  ): TransactionNotificationObject {
    return {
      notificationKey: 'visaDebitCardCreated',
      dynamicContent: [String(amount)],
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

  private async loadBalanceVisaCard(
    tokenCode: string,
    calculatedAmount: number,
    referenceId: string,
    payment: number,
    programEndDate: Date,
  ): Promise<IntersolveLoadResponseDto> {
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
          expiresAt: programEndDate.toISOString(),
        },
      ],
    };
    return await this.intersolveVisaApiService.loadBalanceCard(
      tokenCode,
      payload,
    );
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
