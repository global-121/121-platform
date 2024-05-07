import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { FspConfigurationEnum, FspName } from '../../../fsp/enum/fsp-name.enum';
import { MessageContentType } from '../../../notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '../../../notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '../../../notifications/message-job.dto';
import { QueueMessageService } from '../../../notifications/queue-message/queue-message.service';
import { ProgramFspConfigurationEntity } from '../../../programs/fsp-configuration/program-fsp-configuration.entity';
import { RegistrationDataOptions } from '../../../registration/dto/registration-data-relation.model';
import { Attributes } from '../../../registration/dto/update-registration.dto';
import { CustomDataAttributes } from '../../../registration/enum/custom-data-attributes';
import { ErrorEnum } from '../../../registration/errors/registration-data.error';
import { RegistrationDataService } from '../../../registration/modules/registration-data/registration-data.service';
import { RegistrationScopedRepository } from '../../../registration/repositories/registration-scoped.repository';
import { ScopedRepository } from '../../../scoped.repository';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { formatPhoneNumber } from '../../../utils/phone-number.helpers';
import { RegistrationDataScopedQueryService } from '../../../utils/registration-data-query/registration-data-query.service';
import { getScopedRepositoryProviderName } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '../../dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '../../dto/transaction-relation-details.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '../../enum/queue.names.enum';
import { getRedisSetName, REDIS_CLIENT } from '../../redis-client';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { RegistrationEntity } from './../../../registration/registration.entity';
import {
  BlockReasonEnum,
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
  UnblockReasonEnum,
} from './dto/intersolve-block.dto';
import {
  CreateCustomerResponseExtensionDto,
  IntersolveCreateCustomerResponseBodyDto,
  IntersolveLinkWalletCustomerResponseDto,
} from './dto/intersolve-create-customer-response.dto';
import {
  IntersolveAddressDto,
  IntersolveCreateCustomerDto,
} from './dto/intersolve-create-customer.dto';
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
import {
  IntersolveGetTransactionsResponseDataDto,
  TransactionInfoVisa,
} from './dto/intersolve-get-wallet-transactions.dto';
import { IntersolveLoadResponseDto } from './dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from './dto/intersolve-load.dto';
import { IntersolveReponseErrorDto } from './dto/intersolve-response-error.dto';
import { PaymentDetailsDto } from './dto/payment-details.dto';
import {
  IntersolveVisaPaymentInfoEnum,
  IntersolveVisaPaymentInfoEnumBackupName,
} from './enum/intersolve-visa-payment-info.enum';
import { VisaErrorCodes } from './enum/visa-error-codes.enum';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import {
  IntersolveVisaWalletEntity,
  IntersolveVisaWalletStatus,
} from './intersolve-visa-wallet.entity';
import { IntersolveVisaApiService } from './intersolve-visa.api.service';
import { maximumAmountOfSpentCentPerMonth } from './intersolve-visa.const';
import { IntersolveVisaStatusMappingService } from './services/intersolve-visa-status-mapping.service';

@Injectable()
export class IntersolveVisaService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(ProgramFspConfigurationEntity)
  public readonly programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;

  public constructor(
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly registrationDataQueryService: RegistrationDataScopedQueryService,
    private readonly intersolveVisaStatusMappingService: IntersolveVisaStatusMappingService,
    private readonly queueMessageService: QueueMessageService,
    @InjectQueue(QueueNamePayment.paymentIntersolveVisa)
    private readonly paymentIntersolveVisaQueue: Queue,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    @Inject(getScopedRepositoryProviderName(IntersolveVisaCustomerEntity))
    private intersolveVisaCustomerScopedRepo: ScopedRepository<IntersolveVisaCustomerEntity>,
    @Inject(getScopedRepositoryProviderName(IntersolveVisaWalletEntity))
    private intersolveVisaWalletScopedRepo: ScopedRepository<IntersolveVisaWalletEntity>,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async getTransactionInfoByCustomer(
    visaCustomer: IntersolveVisaCustomerEntity,
  ): Promise<{ tokenCode: string; transactionInfo: TransactionInfoVisa }[]> {
    const dateFrom = this.getTwoMonthAgo();
    const transactionInfoByCustomer = [];

    for (const wallet of visaCustomer.visaWallets) {
      const walletTransactionInfo = await this.getTransactionInfoByWallet(
        wallet.tokenCode,
        dateFrom,
      );
      transactionInfoByCustomer.push({
        tokenCode: wallet.tokenCode,
        transactionInfo: walletTransactionInfo,
      });
    }
    return transactionInfoByCustomer;
  }

  public async getTransactionInfoByWallet(
    tokenCode: string,
    dateFrom?: Date,
  ): Promise<TransactionInfoVisa> {
    const transactionDetails =
      await this.intersolveVisaApiService.getTransactions(tokenCode, dateFrom);
    if (!transactionDetails.data?.success) {
      const error =
        transactionDetails.data?.errors ||
        'Intersolve-visa: Get transactions API-call failed';
      console.error(error);
      throw new HttpException(
        {
          errors: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR, // This is 500 so that when this fails in a non-payment use case it will lead to an alert
      );
    }
    const walletTransactions = transactionDetails.data.data;
    // Filter out all transactions that are not reservations
    // reservation is the type that is used for payments in a shop
    let walletReserveTransactions = [];
    let expiredReserveTransactions = [];
    if (walletTransactions && walletTransactions.length > 0) {
      walletReserveTransactions = walletTransactions.filter(
        (t) => t.type === 'RESERVATION',
      );
      expiredReserveTransactions = walletTransactions.filter(
        (t) => t.type === 'RESERVATION_EXPIRED',
      );
    }
    return {
      lastUsedDate: this.getLastTransactionDate(walletReserveTransactions),
      spentThisMonth: this.calculateSpentThisMonth(
        walletReserveTransactions,
        expiredReserveTransactions,
      ),
    };
  }

  private getLastTransactionDate(
    walletTransactions: IntersolveGetTransactionsResponseDataDto[],
  ): null | Date {
    if (walletTransactions && walletTransactions.length > 0) {
      const sortedByDate = walletTransactions.sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      if (sortedByDate.length > 0) {
        const dateString = sortedByDate[0].createdAt;
        return new Date(dateString);
      }
    }
    return null;
  }

  private calculateSpentThisMonth(
    walletTransactions: IntersolveGetTransactionsResponseDataDto[],
    expiredReserveTransactions: IntersolveGetTransactionsResponseDataDto[],
  ): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    let total = 0;
    const originalTransactionIdsOfExpiredReservations =
      expiredReserveTransactions.map((r) => r.originalTransactionId);
    for (const transaction of walletTransactions) {
      const transactionDate = new Date(transaction.createdAt);
      if (
        transactionDate.getMonth() === thisMonth &&
        transactionDate.getFullYear() === thisYear &&
        !originalTransactionIdsOfExpiredReservations.includes(transaction.id) // check that this reservation did not later expire
      ) {
        total += transaction.quantity.value;
      }
    }
    // We get back negative numbers which needs to be reversed to a positive number
    const reversed = -total;
    return reversed;
  }

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<void> {
    const paymentDetailsArray = await this.getPaPaymentDetails(paymentList);

    for (const paymentDetails of paymentDetailsArray) {
      paymentDetails.programId = programId;
      paymentDetails.paymentNr = paymentNr;
      paymentDetails.bulkSize = paymentList[0].bulkSize;
      paymentDetails.programId = programId;
      const job = await this.paymentIntersolveVisaQueue.add(
        ProcessNamePayment.sendPayment,
        paymentDetails,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
  }

  private async getTransactionAmountPerRegistration(
    maxAmount: number,
    wallet: IntersolveVisaWalletEntity,
    customer: IntersolveVisaCustomerEntity,
  ): Promise<number> {
    const updatedWallet = await this.getUpdateWalletDetails(
      wallet,
      customer,
      true,
    );
    const calculatedAmount = updatedWallet.calculateTopUpAmount();
    if (calculatedAmount > 0) {
      return Math.min(calculatedAmount, maxAmount);
    } else {
      return 0;
    }
  }

  public async getQueueProgress(programId?: number): Promise<number> {
    if (programId) {
      // Get the count of job IDs in the Redis set for the program
      const count = await this.redisClient.scard(getRedisSetName(programId));
      return count;
    } else {
      // If no programId is provided, use Bull's method to get the total delayed count
      // This requires an instance of the Bull queue
      const delayedCount =
        await this.paymentIntersolveVisaQueue.getDelayedCount();
      return delayedCount;
    }
  }

  public async processQueuedPayment(
    paymentDetailsData: PaymentDetailsDto,
  ): Promise<void> {
    const paymentRequestResultPerPa = await this.sendPaymentToPa(
      paymentDetailsData,
      paymentDetailsData.paymentNr,
      paymentDetailsData.transactionAmount,
      paymentDetailsData.bulkSize,
    );
    const transactionRelationDetails: TransactionRelationDetailsDto = {
      programId: paymentDetailsData.programId,
      paymentNr: paymentDetailsData.paymentNr,
      userId: paymentDetailsData.userId,
    };

    await this.transactionsService.storeTransactionUpdateStatus(
      paymentRequestResultPerPa,
      transactionRelationDetails,
    );
  }

  private async getPaPaymentDetails(
    paymentList: PaPaymentDataDto[],
  ): Promise<PaymentDetailsDto[]> {
    const referenceIds = paymentList.map((pa) => pa.referenceId);
    const relationOptions = await this.getRelationOptionsForVisa(
      referenceIds[0],
    );
    const visaAddressInfoDtoArray =
      await this.registrationDataQueryService.getPaDetails(
        referenceIds,
        relationOptions,
      );

    // Maps the registration data back to the correct amounts using referenceID
    const result = visaAddressInfoDtoArray.map((v) => ({
      ...v,
      ...paymentList.find((s) => s.referenceId === v.referenceId),
    }));

    // Set first name to empy string if it is null or undefined
    // This is needed because the intersolve API does not accept null values
    result.forEach((r) => {
      if (!r.firstName) {
        r.firstName = '';
      }
    });

    return result;
  }

  private async getRelationOptionsForVisa(
    referenceId: string,
  ): Promise<RegistrationDataOptions[]> {
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId },
    });
    const registrationDataOptions: RegistrationDataOptions[] = [];
    for (const attr of Object.values(IntersolveVisaPaymentInfoEnum)) {
      let relation;
      try {
        relation = await this.registrationDataService.getRelationForName(
          registration,
          attr,
        );
      } catch (error) {
        // If a program does not have lastName: use fullName instead
        if (
          error.name === ErrorEnum.RegistrationDataError &&
          attr === IntersolveVisaPaymentInfoEnum.lastName
        ) {
          relation = await this.registrationDataService.getRelationForName(
            registration,
            IntersolveVisaPaymentInfoEnumBackupName.fullName,
          );
        } else if (
          // If a program does not have firstName: ignore and continue
          error.name === ErrorEnum.RegistrationDataError &&
          attr === IntersolveVisaPaymentInfoEnum.firstName
        ) {
          continue;
        } else {
          throw error;
        }
      }
      const registrationDataOption = {
        name: attr,
        relation: relation,
      };
      registrationDataOptions.push(registrationDataOption);
    }
    return registrationDataOptions;
  }

  public async sendPaymentToPa(
    paymentDetails: PaymentDetailsDto,
    paymentNr: number,
    calculatedAmount: number,
    bulkSizeCompletePayment: number,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.referenceId = paymentDetails.referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = calculatedAmount;
    paTransactionResult.fspName = FspName.intersolveVisa;

    const transactionNotifications = [];

    const registration = await this.registrationScopedRepository.findOne({
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
      if (!createCustomerResult.data?.success) {
        paTransactionResult.status = StatusEnum.error;
        paTransactionResult.message = `CREATE CUSTOMER ERROR: ${
          this.intersolveErrorToMessage(createCustomerResult.data?.errors) ||
          `${createCustomerResult.status} - ${createCustomerResult.statusText}`
        }`;
        return paTransactionResult;
      }

      // if success, store customer
      visaCustomer = new IntersolveVisaCustomerEntity();
      visaCustomer.registration = registration;
      visaCustomer.holderId = createCustomerResult.data.data.id;
      await this.intersolveVisaCustomerScopedRepo.save(visaCustomer);
    }

    // Check if a wallet exists
    if (!visaCustomer.visaWallets?.length) {
      // If not, create wallet
      const createWalletResult = await this.createWallet(
        visaCustomer,
        calculatedAmount,
        registration.programId,
      );

      // if error, return error
      if (!createWalletResult.data?.success) {
        paTransactionResult.status = StatusEnum.error;
        paTransactionResult.message = `CREATE WALLET ERROR: ${
          this.intersolveErrorToMessage(createWalletResult.data?.errors) ||
          `${createWalletResult.status} - ${createWalletResult.statusText}`
        }`;
        return paTransactionResult;
      }

      // if success, store wallet
      const intersolveVisaWallet = new IntersolveVisaWalletEntity();
      intersolveVisaWallet.tokenCode = createWalletResult.data.data.token.code;
      intersolveVisaWallet.tokenBlocked =
        createWalletResult.data.data.token.blocked;
      intersolveVisaWallet.intersolveVisaCustomer = visaCustomer;
      intersolveVisaWallet.walletStatus = createWalletResult.data.data.token
        .status as IntersolveVisaWalletStatus;
      intersolveVisaWallet.balance =
        createWalletResult.data.data.token.balances.find(
          (b) =>
            b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE,
        ).quantity.value;
      intersolveVisaWallet.lastExternalUpdate = new Date();
      await this.intersolveVisaWalletScopedRepo.save(intersolveVisaWallet);

      visaCustomer.visaWallets = [intersolveVisaWallet];
    }

    // sort wallets by newest creation date first, so that we can hereafter assume the first element represents the current wallet
    visaCustomer.visaWallets.sort((a, b) => (a.created < b.created ? 1 : -1));

    // Check if wallet is linked to customer
    if (!visaCustomer.visaWallets[0].linkedToVisaCustomer) {
      // if not, link wallet to customer
      const registerResult = await this.linkWalletToCustomer(
        visaCustomer,
        visaCustomer.visaWallets[0],
      );

      // if error, return error
      if (!this.isSuccessResponseStatus(registerResult.status)) {
        paTransactionResult.status = StatusEnum.error;
        paTransactionResult.message = `LINK CUSTOMER ERROR: ${
          this.intersolveErrorToMessage(registerResult.data?.errors) ||
          registerResult.data?.code ||
          `${registerResult.status} - ${registerResult.statusText}`
        }`;
        paTransactionResult.customData = {
          intersolveVisaWalletTokenCode: visaCustomer.visaWallets[0].tokenCode,
        };
        return paTransactionResult;
      }

      // if succes, update wallet: set linkedToVisaCustomer to true
      visaCustomer.visaWallets[0].linkedToVisaCustomer = true;
      await this.intersolveVisaWalletScopedRepo.save(
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

      const createDebitCardResultStatus = this.isSuccessResponseStatus(
        createDebitCardResult.status,
      );
      // error or success: set transaction result either way
      paTransactionResult.status = createDebitCardResultStatus
        ? StatusEnum.success
        : StatusEnum.error;
      paTransactionResult.message = createDebitCardResultStatus
        ? null
        : `CREATE DEBIT CARD ERROR: ${
            this.intersolveErrorToMessage(createDebitCardResult.data?.errors) ||
            `${createDebitCardResult.status} - ${createDebitCardResult.statusText}`
          }`;
      paTransactionResult.customData = {
        intersolveVisaWalletTokenCode: visaCustomer.visaWallets[0].tokenCode,
      };

      // if success, update wallet: set debitCardCreated to true ..
      if (paTransactionResult.status === StatusEnum.success) {
        visaCustomer.visaWallets[0].debitCardCreated = true;
        await this.intersolveVisaWalletScopedRepo.save(
          visaCustomer.visaWallets[0],
        );

        // .. and add 'debit card created' notification
        transactionNotifications.push(
          this.buildNotificationObjectIssueDebitCard(
            calculatedAmount,
            bulkSizeCompletePayment,
          ),
        );
      }
    } else {
      // If yes, load balance
      // Calculate the amount that should be paid out, taking the original calculatedAmount as MAX value.
      let topupAmount;
      try {
        topupAmount = await this.getTransactionAmountPerRegistration(
          calculatedAmount,
          visaCustomer.visaWallets[0],
          visaCustomer,
        );
      } catch (error) {
        paTransactionResult.status = StatusEnum.error;
        let errorMessage = 'Unknown';
        if (error?.response?.errors) {
          errorMessage =
            this.intersolveErrorToMessage(error.response.errors) ||
            error.response.errors;
        } else {
          console.error('Error in CALCULATE TOPUP AMOUNT:', error);
        }
        paTransactionResult.message = `CALCULATE TOPUP AMOUNT ERROR: ${errorMessage}`;
        paTransactionResult.customData = {
          intersolveVisaWalletTokenCode: visaCustomer.visaWallets[0].tokenCode,
        };
        return paTransactionResult;
      }

      paTransactionResult.calculatedAmount = topupAmount;
      // If calculatedAmount is larger than 0, call Intersolve
      if (topupAmount > 0) {
        const loadBalanceResult = await this.loadBalanceVisaCard(
          visaCustomer.visaWallets[0].tokenCode,
          topupAmount,
          registration.referenceId,
          paymentNr,
        );

        paTransactionResult.status = loadBalanceResult.data?.success
          ? StatusEnum.success
          : StatusEnum.error;
        paTransactionResult.message = loadBalanceResult.data?.success
          ? null
          : `LOAD BALANCE CARD ERROR: ${
              this.intersolveErrorToMessage(loadBalanceResult.data?.errors) ||
              `${loadBalanceResult.status} - ${loadBalanceResult.statusText}`
            }`;
      } else {
        // If topupAmount is 0, DON'T call Intersolve. Create a   successfull transaction
        paTransactionResult.status = StatusEnum.success;
        paTransactionResult.message = null;
      }
      paTransactionResult.customData = {
        intersolveVisaWalletTokenCode: visaCustomer.visaWallets[0].tokenCode,
      };

      transactionNotifications.push(
        this.buildNotificationObjectLoadBalance(
          topupAmount,
          bulkSizeCompletePayment,
        ),
      );
    }

    paTransactionResult.notificationObjects = transactionNotifications;
    return paTransactionResult;
  }

  private async getCustomerEntity(
    registrationId: number,
  ): Promise<IntersolveVisaCustomerEntity> {
    return await this.intersolveVisaCustomerScopedRepo.findOne({
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
        addresses: [this.createCustomerAddressPayload(paymentDetails)],
        phoneNumbers: [
          {
            type: 'MOBILE',
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
    programId: number,
  ): Promise<IntersolveCreateWalletResponseDto> {
    const amountInCents = Math.round(calculatedAmount * 100);
    const createWalletPayload = new IntersolveCreateWalletDto();
    createWalletPayload.reference = visaCustomer.holderId;
    if (calculatedAmount > 0) {
      createWalletPayload.quantities = [
        {
          quantity: {
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
            value: amountInCents,
          },
        },
      ];
    }

    const brandCode = await this.getBrandcodeForProgram(programId);
    const createWalletResult = await this.intersolveVisaApiService.createWallet(
      createWalletPayload,
      brandCode,
    );
    return createWalletResult;
  }

  private async linkWalletToCustomer(
    customerEntity: IntersolveVisaCustomerEntity,
    walletEntity: IntersolveVisaWalletEntity,
  ): Promise<IntersolveLinkWalletCustomerResponseDto> {
    return await this.intersolveVisaApiService.linkCustomerToWallet(
      {
        holderId: customerEntity.holderId,
      },
      walletEntity.tokenCode,
    );
  }

  private async getBrandcodeForProgram(programId: number): Promise<string> {
    const brandCodeConfig =
      await this.programFspConfigurationRepository.findOne({
        where: {
          programId: programId,
          name: FspConfigurationEnum.brandCode,
          fsp: { fsp: FspName.intersolveVisa },
        },
        relations: ['fsp'],
      });
    if (!brandCodeConfig) {
      throw new Error(
        `No brandCode found for program ${programId}. Please update the program FSP cofinguration.`,
      );
    }

    return brandCodeConfig?.value as string;
  }

  private async getCoverLetterCodeForProgram(
    programId: number,
  ): Promise<string> {
    const coverLetterCodeConfig =
      await this.programFspConfigurationRepository.findOne({
        where: {
          programId: programId,
          name: FspConfigurationEnum.coverLetterCode,
          fsp: { fsp: FspName.intersolveVisa },
        },
        relations: ['fsp'],
      });

    if (!coverLetterCodeConfig) {
      throw new Error(
        `No coverLetterCode found for financial service provider under program ${programId}. Please update the program's financial service provider cofinguration.`,
      );
    }

    return coverLetterCodeConfig?.value as string;
  }

  private async createDebitCard(
    paymentDetails: PaymentDetailsDto,
    intersolveVisaWallet: IntersolveVisaWalletEntity,
  ): Promise<IntersolveCreateDebitCardResponseDto> {
    const createDebitCardPayload = new IntersolveCreateDebitCardDto();
    createDebitCardPayload.brand = 'VISA_CARD';
    createDebitCardPayload.firstName = paymentDetails.firstName;
    createDebitCardPayload.lastName = paymentDetails.lastName;
    createDebitCardPayload.mobileNumber = paymentDetails.phoneNumber
      ? formatPhoneNumber(paymentDetails.phoneNumber)
      : null;
    createDebitCardPayload.cardAddress = {
      address1:
        `${paymentDetails.addressStreet} ${paymentDetails.addressHouseNumber} ${paymentDetails.addressHouseNumberAddition}`.trim(),
      city: paymentDetails.addressCity,
      country: 'NLD',
      postalCode: paymentDetails.addressPostalCode,
    };
    createDebitCardPayload.pinAddress = {
      address1:
        `${paymentDetails.addressStreet} ${paymentDetails.addressHouseNumber} ${paymentDetails.addressHouseNumberAddition}`.trim(),
      city: paymentDetails.addressCity,
      country: 'NLD',
      postalCode: paymentDetails.addressPostalCode,
    };
    createDebitCardPayload.pinStatus = 'D';

    try {
      // Added cover letter code during create debit card call
      const coverLetterCode = await this.getCoverLetterCodeForProgram(
        paymentDetails.programId,
      );
      createDebitCardPayload.coverLetterCode = coverLetterCode;
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        statusText: error.message,
        data: {
          success: false,
        },
      };
    }

    return await this.intersolveVisaApiService.createDebitCard(
      intersolveVisaWallet.tokenCode,
      createDebitCardPayload,
    );
  }

  private buildNotificationObjectIssueDebitCard(
    amount: number,
    bulkSizeCompletePayment: number,
  ): TransactionNotificationObject {
    return {
      notificationKey: ProgramNotificationEnum.visaDebitCardCreated,
      dynamicContent: [String(amount)],
      bulkSize: bulkSizeCompletePayment,
    };
  }

  private buildNotificationObjectLoadBalance(
    amount: number,
    bulkSizeCompletePayment: number,
  ): TransactionNotificationObject {
    return {
      notificationKey: ProgramNotificationEnum.visaLoad,
      dynamicContent: [String(amount)],
      bulkSize: bulkSizeCompletePayment,
    };
  }

  private async loadBalanceVisaCard(
    tokenCode: string,
    calculatedAmount: number,
    referenceId: string,
    payment: number,
  ): Promise<IntersolveLoadResponseDto> {
    const amountInCents = Math.round(calculatedAmount * 100);
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

  private async unloadBalanceVisaCard(
    tokenCode: string,
    currentBalance: number,
  ): Promise<IntersolveLoadResponseDto> {
    const reference = uuid();
    const payload: IntersolveLoadDto = {
      reference: reference,
      quantities: [
        {
          quantity: {
            value: currentBalance,
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE,
          },
        },
      ],
    };
    return await this.intersolveVisaApiService.unloadBalanceCard(
      tokenCode,
      payload,
    );
  }

  private intersolveErrorToMessage(
    errors: IntersolveReponseErrorDto[],
  ): string {
    if (!errors || !Array.isArray(errors) || !errors.length) {
      return;
    }
    let allMessages = '';
    for (const [i, error] of errors.entries()) {
      const newLine = i < errors.length - 1 ? '\n' : '';
      allMessages = `${allMessages}${error.code}: ${error.description} Field: ${error.field}${newLine}`;
    }
    return allMessages;
  }

  private async getUpdateWalletDetails(
    wallet: IntersolveVisaWalletEntity,
    customer: IntersolveVisaCustomerEntity,
    getPaymentDetailsOnly: boolean,
  ): Promise<IntersolveVisaWalletEntity> {
    const walletDetails = await this.intersolveVisaApiService.getWallet(
      wallet.tokenCode,
    );
    if (!walletDetails.data?.success) {
      const error =
        walletDetails.data?.errors ||
        'Intersolve-visa: Get wallet API-call failed';
      console.error(error);
      throw new HttpException(
        {
          errors: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR, // This is 500 so that when this fails in a non-payment use case it will lead to an alert
      );
    }

    const walletData = walletDetails?.data?.data;
    if (walletData?.balances) {
      wallet.balance = walletData.balances.find(
        (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE,
      ).quantity.value;
    }
    if (walletData?.status) {
      wallet.walletStatus = walletDetails.data.data.status;
    }
    if (walletData?.blocked === true || walletData?.blocked === false) {
      wallet.tokenBlocked = walletDetails.data.data.blocked;
    }

    // Get spentThisMonth across all wallets of customer
    const transactionInfoByCustomer =
      await this.getTransactionInfoByCustomer(customer);

    if (transactionInfoByCustomer.length) {
      wallet.spentThisMonth = transactionInfoByCustomer
        .map((w) => w.transactionInfo.spentThisMonth)
        .reduce((sum, current) => sum + current, 0);
    }

    if (!getPaymentDetailsOnly) {
      // The below properties are not needed in payment amount calculation
      // Get lastUsedDate is still per wallet, unlike spentThisMonth above
      // If above API-call failed, then this code will simply not update lastUsedDate which is fine
      const transactionInfoPerWallet = transactionInfoByCustomer?.find(
        (w) => w.tokenCode === wallet.tokenCode,
      )?.transactionInfo;
      if (transactionInfoPerWallet?.lastUsedDate) {
        wallet.lastUsedDate = transactionInfoPerWallet.lastUsedDate;
      }
      wallet.lastExternalUpdate = new Date();

      const cardDetails = await this.intersolveVisaApiService.getCard(
        wallet.tokenCode,
      );
      if (cardDetails?.data?.data?.status) {
        wallet.cardStatus = cardDetails.data.data.status;
      }
    }

    return await this.intersolveVisaWalletScopedRepo.save(wallet);
  }

  private getTwoMonthAgo(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date;
  }

  public async getVisaWalletsAndDetails(
    referenceId: string,
    programId: number,
  ): Promise<GetWalletsResponseDto> {
    const { registration: _registration, visaCustomer } =
      await this.getRegistrationAndVisaCustomer(referenceId, programId);

    const walletsResponse = new GetWalletsResponseDto();
    walletsResponse.wallets = [];

    for await (let wallet of visaCustomer.visaWallets) {
      wallet = await this.getUpdateWalletDetails(wallet, visaCustomer, false);

      const walletDetailsResponse = new GetWalletDetailsResponseDto();
      walletDetailsResponse.tokenCode = wallet.tokenCode;
      walletDetailsResponse.balance = wallet.balance;

      // Map Intersolve status to 121 status for the frontend
      const statusInfo =
        this.intersolveVisaStatusMappingService.determine121StatusInfo(
          wallet.tokenBlocked,
          wallet.walletStatus,
          wallet.cardStatus,
          wallet.tokenCode === visaCustomer.visaWallets[0].tokenCode,
          {
            tokenCode: wallet.tokenCode,
            programId: programId,
            referenceId: referenceId,
          },
        );
      walletDetailsResponse.status = statusInfo.walletStatus121;
      walletDetailsResponse.explanation = statusInfo.explanation;
      walletDetailsResponse.links = statusInfo.links;
      walletDetailsResponse.issuedDate = wallet.created;
      walletDetailsResponse.lastUsedDate = wallet.lastUsedDate;
      walletDetailsResponse.spentThisMonth = wallet.spentThisMonth;

      // These properties are not used in the frontend but are very useful for debugging
      walletDetailsResponse.intersolveVisaCardStatus = wallet.cardStatus;
      walletDetailsResponse.intersolveVisaWalletStatus = wallet.walletStatus;

      walletDetailsResponse.maxToSpendPerMonth =
        maximumAmountOfSpentCentPerMonth;

      walletsResponse.wallets.push(walletDetailsResponse);
    }
    return walletsResponse;
  }

  private async getRegistrationAndVisaCustomer(
    referenceId: string,
    programId: number,
  ): Promise<{
    registration: RegistrationEntity;
    visaCustomer: IntersolveVisaCustomerEntity;
  }> {
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId, programId: programId },
      relations: ['fsp'],
    });
    if (!registration) {
      const errors = `No registration found with referenceId ${referenceId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const visaCustomer = await this.getCustomerEntity(registration.id);
    if (registration.fsp.fsp !== FspName.intersolveVisa) {
      const errors = `Registration with referenceId ${referenceId} is not an Intersolve Visa registration`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    if (!visaCustomer) {
      const errors = `${VisaErrorCodes.NoCustomerYet} with referenceId ${referenceId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    visaCustomer.visaWallets.sort((a, b) => (a.created > b.created ? -1 : 1));
    return { registration: registration, visaCustomer: visaCustomer };
  }

  public async toggleBlockWallet(
    tokenCode: string,
    block: boolean,
  ): Promise<IntersolveBlockWalletResponseDto> {
    const payload: IntersolveBlockWalletDto = {
      reasonCode: block
        ? BlockReasonEnum.BLOCK_GENERAL // If using 'TOKEN_DISABLED' the wallet will supposably be blocked forever
        : UnblockReasonEnum.UNBLOCK_GENERAL,
    };
    const result = await this.intersolveVisaApiService.toggleBlockWallet(
      tokenCode,
      payload,
      block,
    );
    if (
      this.isSuccessResponseStatus(result.status) ||
      (result.status === 405 &&
        ['TOKEN_IS_ALREADY_BLOCKED', 'TOKEN_IS_NOT_BLOCKED'].includes(
          result.data?.code,
        ))
    ) {
      await this.intersolveVisaWalletScopedRepo.updateUnscoped(
        { tokenCode: tokenCode },
        { tokenBlocked: block },
      );
    }

    return result;
  }

  public async toggleBlockWalletNotification(
    tokenCode: string,
    block: boolean,
    programId: number,
  ): Promise<IntersolveBlockWalletResponseDto> {
    const qb = this.intersolveVisaWalletScopedRepo
      .createQueryBuilder('wallet')
      .leftJoinAndSelect(
        'wallet.intersolveVisaCustomer',
        'intersolveVisaCustomer',
      )
      .leftJoinAndSelect('intersolveVisaCustomer.registration', 'registration')
      .andWhere('wallet.tokenCode = :tokenCode', { tokenCode });
    const wallet = await qb.getOne();

    if (
      !wallet ||
      !wallet.intersolveVisaCustomer ||
      !wallet.intersolveVisaCustomer.registration ||
      wallet.intersolveVisaCustomer.registration.programId !== programId
    ) {
      const errors = `No wallet found with tokenCode ${tokenCode}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const result = await this.toggleBlockWallet(tokenCode, block);

    let notificationKey: string;
    block
      ? (notificationKey = ProgramNotificationEnum.blockVisaCard)
      : (notificationKey = ProgramNotificationEnum.unblockVisaCard);

    await this.queueMessageService.addMessageToQueue(
      wallet.intersolveVisaCustomer.registration,
      null,
      notificationKey,
      MessageContentType.custom,
      MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    );
    return result;
  }

  private createCustomerAddressPayload(
    paymentDetails: PaymentDetailsDto,
  ): IntersolveAddressDto {
    return {
      type: 'HOME',
      addressLine1: `${
        paymentDetails.addressStreet +
        ' ' +
        paymentDetails.addressHouseNumber +
        paymentDetails.addressHouseNumberAddition
      }`,
      city: paymentDetails.addressCity,
      postalCode: paymentDetails.addressPostalCode,
      country: 'NL',
    };
  }

  private doAnyAttributesRequireSync(
    attributes: CustomDataAttributes[],
  ): boolean {
    const attributesThatRequireSync = [
      CustomDataAttributes.phoneNumber,
      CustomDataAttributes.addressCity,
      CustomDataAttributes.addressHouseNumber,
      CustomDataAttributes.addressHouseNumberAddition,
      CustomDataAttributes.addressPostalCode,
      CustomDataAttributes.addressStreet,
    ];

    return attributes.some((attribute) =>
      attributesThatRequireSync.includes(attribute),
    );
  }

  public async syncIntersolveCustomerWith121(
    referenceId: string,
    programId: number,
    attributes?: Attributes[] | string[],
  ): Promise<void> {
    if (
      attributes &&
      !this.doAnyAttributesRequireSync(attributes as CustomDataAttributes[])
    ) {
      return;
    }
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId, programId: programId },
    });
    const visaCustomer = await this.getCustomerEntity(registration.id);

    const errors = [];

    const phoneNumberPayload: CreateCustomerResponseExtensionDto = {
      type: 'MOBILE',
      value: registration.phoneNumber,
    };
    const phoneNumberResult =
      await this.intersolveVisaApiService.updateCustomerPhoneNumber(
        visaCustomer.holderId,
        phoneNumberPayload,
      );
    if (!this.isSuccessResponseStatus(phoneNumberResult.status)) {
      errors.push(
        `Phone number update failed: ${phoneNumberResult?.data?.code}. Adjust the (required) phone number and retry.`,
      );
    }

    try {
      const relationOptions = await this.getRelationOptionsForVisa(referenceId);
      const paymentDetails =
        await this.registrationDataQueryService.getPaDetails(
          [referenceId],
          relationOptions,
        );

      const addressPayload = this.createCustomerAddressPayload(
        paymentDetails[0],
      );
      const addressResult =
        await this.intersolveVisaApiService.updateCustomerAddress(
          visaCustomer.holderId,
          addressPayload,
        );
      if (!this.isSuccessResponseStatus(addressResult.status)) {
        errors.push(`Address update failed: ${addressResult?.data?.code}.`);
      }

      if (errors.length > 0) {
        throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      if (error.name === ErrorEnum.RegistrationDataError) {
        console.info(
          `Unable to sync address data because this registration does not have this data anymore.\n
          This is most likely because this registration first had the FSP Intersolve Visa, and then switched to another FSP\n
          This new fsp does not have the attributes needed for Intersolve Visa, so the data is removed from the registration`,
        );
      } else {
        throw error;
      }
    }
  }

  public async reissueWalletAndCard(
    referenceId: string,
    programId: number,
  ): Promise<any> {
    const { registration: _registration, visaCustomer } =
      await this.getRegistrationAndVisaCustomer(referenceId, programId);
    if (visaCustomer.visaWallets.length === 0) {
      const errors = `No wallet available yet for PA with this referenceId ${referenceId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const oldWallets = visaCustomer.visaWallets.sort((a, b) =>
      a.created < b.created ? 1 : -1,
    );
    const oldWallet = oldWallets[0];

    const errorGenericPart = `<br><br>Update data if applicable and retry by using the 'Issue new card' button again. If the problem persists, contact 121 technical support.`;
    // 0. sync customer data with 121 data, as create-customer is skipped in this flow
    try {
      await this.syncIntersolveCustomerWith121(referenceId, programId);
    } catch (error) {
      const errors = `SYNC CUSTOMER DATA ERROR: <strong>${error.response?.errors.join(
        ',',
      )}</strong>${errorGenericPart}`;
      throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 0. Try to unblock wallet to be able to activate it
    try {
      await this.toggleBlockWallet(oldWallet.tokenCode, false);
    } catch (error) {
      if (error.status !== 405 && error.data?.code !== 'TOKEN_IS_NOT_BLOCKED') {
        throw error;
      }
    }
    // 1. activate old wallet (if needed) to be able to get & unload balance
    try {
      await this.intersolveVisaApiService.activateWallet(oldWallet.tokenCode, {
        reference: uuid(),
      });
    } catch (error) {
      if (error.status === 405 && error.data?.code === 'TOKEN_IS_NOT_ACTIVE') {
        console.log('error: ', error);
      } else {
        const errors = `ACTIVATE OLD WALLET ERROR: ${
          this.intersolveErrorToMessage(error.data?.errors) ||
          error.data?.code ||
          `${error.status} - ${error.statusText}`
        }`;
        throw new HttpException(
          {
            errors: `<strong>${errors}</strong>${errorGenericPart}`,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // 2. unblock old wallet (if needed) to be able to unload balance later and to prevent transactions in the meantime
    try {
      await this.toggleBlockWallet(oldWallet.tokenCode, false);
    } catch (error) {
      if (error.status === 405 && error.data?.code === 'TOKEN_IS_NOT_BLOCKED') {
        console.log('error: ', error);
      } else {
        // if this step fails, then try to block to overwrite the activation from step 1, but don't throw
        // don't do this above if the fail-reason for unblocking was that it was already unblocked (as nothing went wrong then actually)
        await this.tryToBlockWallet(oldWallet.tokenCode);
        const errors = `UNBLOCK OLD WALLET ERROR: ${
          this.intersolveErrorToMessage(error.data?.errors) ||
          error.data?.code ||
          `${error.status} - ${error.statusText}`
        }`;
        throw new HttpException(
          {
            errors: `<strong>${errors}</strong>${errorGenericPart}`,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // 3. get balance of old wallet
    const getWalletResponse = await this.intersolveVisaApiService.getWallet(
      oldWallet.tokenCode,
    );
    if (!getWalletResponse.data?.success) {
      // if this step fails, then try to block to overwrite the activation/unblocking from step 1/2, but don't throw
      await this.tryToBlockWallet(oldWallet.tokenCode);

      const errors = `GET WALLET ERROR: ${
        this.intersolveErrorToMessage(getWalletResponse.data?.errors) ||
        `${getWalletResponse.status} - ${getWalletResponse.statusText}`
      }`;
      throw new HttpException(
        {
          errors: `<strong>${errors}</strong>${errorGenericPart}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const currentBalance = getWalletResponse.data.data.balances.find(
      (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE,
    ).quantity.value;

    // 4. create new wallet
    const createWalletResult = await this.createWallet(
      visaCustomer,
      currentBalance / 100,
      programId,
    );
    if (!createWalletResult.data?.success) {
      // if this step fails, then try to block to overwrite the activation/unblocking from step 1/2, but don't throw
      await this.tryToBlockWallet(oldWallet.tokenCode);

      const errors = `CREATE WALLET ERROR: ${
        this.intersolveErrorToMessage(createWalletResult.data?.errors) ||
        `${createWalletResult.status} - ${createWalletResult.statusText}`
      }`;
      throw new HttpException(
        {
          errors: `<strong>${errors}</strong>${errorGenericPart}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // if success, store wallet
    const newWallet = new IntersolveVisaWalletEntity();
    newWallet.tokenCode = createWalletResult.data.data.token.code;
    newWallet.tokenBlocked = createWalletResult.data.data.token.blocked;
    newWallet.intersolveVisaCustomer = visaCustomer;
    newWallet.walletStatus = createWalletResult.data.data.token
      .status as IntersolveVisaWalletStatus;
    newWallet.balance = createWalletResult.data.data.token.balances.find(
      (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE,
    ).quantity.value;
    newWallet.lastExternalUpdate = new Date();
    await this.intersolveVisaWalletScopedRepo.save(newWallet);

    // 5. register new wallet to customer
    const registerResult = await this.linkWalletToCustomer(
      visaCustomer,
      newWallet,
    );
    if (!this.isSuccessResponseStatus(registerResult.status)) {
      // if this step fails, then try to block to overwrite the activation/unblocking from step 1/2, but don't throw
      await this.tryToBlockWallet(oldWallet.tokenCode);

      // remove wallet again because of incomplete flow
      await this.intersolveVisaWalletScopedRepo.remove(newWallet);
      const errors = `LINK CUSTOMER ERROR: ${
        this.intersolveErrorToMessage(registerResult.data?.errors) ||
        registerResult.data?.code ||
        `${registerResult.status} - ${registerResult.statusText}`
      }`;
      throw new HttpException(
        {
          errors: `<strong>${errors}</strong>${errorGenericPart}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // if succes, update wallet: set linkedToVisaCustomer to true
    newWallet.linkedToVisaCustomer = true;
    await this.intersolveVisaWalletScopedRepo.save(newWallet);

    // 6. create new debit card
    const relationOptions = await this.getRelationOptionsForVisa(referenceId);
    const paymentDetails = await this.registrationDataQueryService.getPaDetails(
      [referenceId],
      relationOptions,
    );
    const createDebitCardResult = await this.createDebitCard(
      paymentDetails[0],
      newWallet,
    );
    if (!this.isSuccessResponseStatus(createDebitCardResult.status)) {
      // if this step fails, then try to block to overwrite the activation/unblocking from step 1/2, but don't throw
      await this.tryToBlockWallet(oldWallet.tokenCode);

      // remove wallet again because of incomplete flow
      await this.intersolveVisaWalletScopedRepo.remove(newWallet);

      const errors = `CREATE DEBIT CARD ERROR: ${
        this.intersolveErrorToMessage(createDebitCardResult.data?.errors) ||
        `${createDebitCardResult.status} - ${createDebitCardResult.statusText}`
      }`;
      throw new HttpException(
        {
          errors: `<strong>${errors}</strong>${errorGenericPart}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // if success, update wallet: set debitCardCreated to true ..
    newWallet.debitCardCreated = true;
    await this.intersolveVisaWalletScopedRepo.save(newWallet);

    // 7. unload balance from old wallet (don't do this if the balance is < 1 because Intersolve doesn't allow this)
    if (currentBalance >= 1) {
      const unloadResult = await this.unloadBalanceVisaCard(
        oldWallet.tokenCode,
        currentBalance,
      );
      if (!this.isSuccessResponseStatus(unloadResult.status)) {
        const errors =
          'The balance of the old card could not be unloaded and it is not permanently blocked yet. <strong>Please contact 121 technical support to solve this.</strong><br><br>Note that the new card was issued, so there is no need to retry.';
        throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    // 8. block old wallet
    const blockResult = await this.toggleBlockWallet(oldWallet.tokenCode, true);
    if (!this.isSuccessResponseStatus(blockResult.status)) {
      const errors =
        'The old card could not be permanently blocked. <strong>Please contact 121 technical support to solve this.</strong><br><br>Note that the new card was issued, so there is no need to retry.';
      throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // also block older wallets, but don't throw error if it fails to not complicate retry-flow further
    for await (const wallet of oldWallets.splice(
      oldWallets.indexOf(oldWallet),
    )) {
      await this.toggleBlockWallet(wallet.tokenCode, true);
    }

    // if success, make sure to store old and new wallet in 121 database
    await this.getVisaWalletsAndDetails(referenceId, programId);
    await this.sendMessageReissueCard(referenceId, programId);
  }

  private async sendMessageReissueCard(
    referenceId: string,
    programId: number,
  ): Promise<void> {
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId, programId: programId },
    });
    await this.queueMessageService.addMessageToQueue(
      registration,
      null,
      ProgramNotificationEnum.reissueVisaCard,
      MessageContentType.custom,
      MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    );
  }

  private async tryToBlockWallet(tokenCode: string): Promise<void> {
    try {
      await this.toggleBlockWallet(tokenCode, true);
    } catch (e) {
      console.log('error: ', e);
    }
  }

  public async updateVisaDebitWalletDetails(): Promise<void> {
    // NOTE: This currently happens for all the Visa Wallets across programs/instances
    const customerWithWallets =
      await this.intersolveVisaCustomerScopedRepo.find({
        relations: ['visaWallets'],
      });
    for (const customer of customerWithWallets) {
      for (const wallet of customer.visaWallets) {
        await this.getUpdateWalletDetails(wallet, customer, false);
      }
    }
  }

  public async hasIntersolveCustomer(registrationId: number): Promise<boolean> {
    const count = await this.intersolveVisaCustomerScopedRepo
      .createQueryBuilder('customer')
      .andWhere('customer.registrationId = :registrationId', { registrationId })
      .getCount();
    return count > 0;
  }

  private isSuccessResponseStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }
}
