import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import {
  GetWalletDetailsResponseDto,
  GetWalletsResponseDto,
} from './dto/intersolve-get-wallet-details.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveReponseErrorDto } from './dto/intersolve-response-error.dto';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import { IntersolveVisaPaymentInfoEnum } from './enum/intersolve-visa-payment-info.enum';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import {
  IntersolveVisaWalletEntity,
  IntersolveVisaWalletStatus,
} from './intersolve-visa-wallet.entity';
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
  public constructor(
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<void> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.intersolveVisa;

    const paymentDetailsArray = await this.getPaPaymentDetails(paymentList);

    for (const paymentDetails of paymentDetailsArray) {
      const paymentRequestResultPerPa = await this.sendPaymentToPa(
        paymentDetails,
        paymentNr,
        paymentDetails.transactionAmount,
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
    paymentList: PaPaymentDataDto[],
  ): Promise<PaymentDetailsDto[]> {
    const referenceIds = paymentList.map((pa) => pa.referenceId);
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

    // Maps the registration data back to the correct amounts using referenceID
    const result = visaAddressInfoDtoArray.map((v) => ({
      ...v,
      ...paymentList.find((s) => s.referenceId === v.referenceId),
    }));
    return result;
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
      await this.intersolveVisaCustomerRepo.save(visaCustomer);
    }

    // Check if a wallet exists
    if (!visaCustomer.visaWallets?.length) {
      // If not, create wallet
      const createWalletResult = await this.createWallet(
        visaCustomer,
        calculatedAmount,
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
      intersolveVisaWallet.status = createWalletResult.data.data.token
        .status as IntersolveVisaWalletStatus;
      intersolveVisaWallet.balance =
        createWalletResult.data.data.token.balances.find(
          (b) => b.quantity.assetCode === 'EUR',
        ).quantity.value;

      await this.intersolveVisaWalletRepository.save(intersolveVisaWallet);

      // TO DO: is this needed like this?
      visaCustomer.visaWallets = [intersolveVisaWallet];
    }

    // sort wallets by newest creation date first, so that we can hereafter assume the first element represents the current wallet
    visaCustomer.visaWallets.sort((a, b) => (a.created < b.created ? 1 : -1));

    // Check if wallet is linked to customer
    if (!visaCustomer.visaWallets[0].linkedToVisaCustomer) {
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
      visaCustomer.visaWallets[0].linkedToVisaCustomer = true;
      await this.intersolveVisaWalletRepository.save(
        visaCustomer.visaWallets[0],
      );
    }

    // Check if debit card is created
    if (!visaCustomer.visaWallets[0].debitCardCreated) {
      // If not, create debit card
      const createDebitCardResult = await this.createDebitCard(
        paymentDetails,
        visaCustomer.visaWallets[0],
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
        visaCustomer.visaWallets[0].debitCardCreated = true;
        await this.intersolveVisaWalletRepository.save(
          visaCustomer.visaWallets[0],
        );

        // .. and add 'debit card created' notification
        transactionNotifications.push(
          this.buildNotificationObjectIssueDebitCard(calculatedAmount),
        );
      }
    } else {
      // If yes, load balance
      const loadBalanceResult = await this.loadBalanceVisaCard(
        visaCustomer.visaWallets[0].tokenCode,
        calculatedAmount,
        registration.referenceId,
        paymentNr,
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
      relations: ['visaWallets'],
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
  ): Promise<IntersolveCreateWalletResponseDto> {
    const amountInCents = calculatedAmount * 100;
    const createWalletPayload = new IntersolveCreateWalletDto();
    createWalletPayload.reference = visaCustomer.holderId;
    createWalletPayload.quantities = [
      {
        quantity: { assetCode: 'EUR', value: amountInCents },
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
      customerEntity.visaWallets[0].tokenCode,
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
    createDebitCardPayload.mobileNumber = paymentDetails.phoneNumber.startsWith(
      '+',
    )
      ? paymentDetails.phoneNumber
      : `+${paymentDetails.phoneNumber}`;
    createDebitCardPayload.cardAddress = {
      address1: `${
        paymentDetails.addressStreet +
        ' ' +
        paymentDetails.addressHouseNumber +
        paymentDetails.addressHouseNumberAddition
      }`,
      city: paymentDetails.addressCity,
      country: 'NLD',
      postalCode: paymentDetails.addressPostalCode,
    };
    createDebitCardPayload.pinAddress = {
      address1: `${
        paymentDetails.addressStreet +
        ' ' +
        paymentDetails.addressHouseNumber +
        paymentDetails.addressHouseNumberAddition
      }`,
      city: paymentDetails.addressCity,
      country: 'NLD',
      postalCode: paymentDetails.addressPostalCode,
    };
    createDebitCardPayload.pinStatus = 'D';
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

  public async getVisaWalletsAndDetails(
    referenceId: string,
  ): Promise<GetWalletsResponseDto> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
    });
    if (!registration) {
      const errors = `No registration found with referenceId ${referenceId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const visaCustomer = await this.getCustomerEntity(registration.id);

    const walletsResponse = new GetWalletsResponseDto();
    walletsResponse.wallets = [];

    for await (const wallet of visaCustomer.visaWallets) {
      const walletDetails = await this.intersolveVisaApiService.getWallet(
        wallet.tokenCode,
      );
      wallet.balance = walletDetails.data.data.balances.find(
        (b) => b.quantity.assetCode === 'EUR',
      ).quantity.value;
      wallet.status = walletDetails.data.data.status;

      // TO DO: to confirm with Intersolve that this is the correct way to get the last used date
      const transactionDetails =
        await this.intersolveVisaApiService.getTransactions(wallet.tokenCode);
      wallet.lastUsedDate = transactionDetails.data.data
        .filter((t) => t.type === 'CHARGE')
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0].createdAt;

      await this.intersolveVisaWalletRepository.save(wallet);

      const walletDetailsResponse = new GetWalletDetailsResponseDto();
      walletDetailsResponse.tokenCode = wallet.tokenCode;
      walletDetailsResponse.balance = wallet.balance;
      walletDetailsResponse.status = wallet.status;
      walletDetailsResponse.issuedDate = wallet.created;
      walletDetailsResponse.lastUsedDate = wallet.lastUsedDate;

      walletsResponse.wallets.push(walletDetailsResponse);
    }
    return walletsResponse;
  }
}
