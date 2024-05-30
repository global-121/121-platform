import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { TransactionNotificationObject } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { QueueNamePayment } from '@121-service/src/payments/enum/queue.names.enum';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { CreateCustomerDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-customer.dto';
import { CreateCustomerResponseExtensionDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-response.dto';
import {
  BlockReasonEnum,
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
  UnblockReasonEnum,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-block.dto';
import {
  GetWalletDetailsResponseDto,
  GetWalletsResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-details.dto';
import {
  IntersolveGetTransactionsResponseDataDto,
  TransactionInfoVisa,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-transactions.dto';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis-client';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/programs/fsp-configuration/program-fsp-configuration.entity';
import { RegistrationDataOptions } from '@121-service/src/registration/dto/registration-data-relation.model';
import { Attributes } from '@121-service/src/registration/dto/update-registration.dto';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { ErrorEnum } from '@121-service/src/registration/errors/registration-data.error';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
// TODO: Remove the formatPhoneNumber import, logic moved to IntersolveVisaApiService
//TODO: Remove this import, as queueing logic moves to the TransferQueuesModule
//TODO: Remove this import, as queueing logic moves to the TransferQueuesModule
import { CreatePhysicalCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-physical-card.dto';
import { GetTokenResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-token-result.dto';
import { AddressDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-request.dto';
import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { IssueTokenDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/issue-token.dto';
import { IntersolveLoadResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load.dto';
import { IntersolveVisaDoTransferOrIssueCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-do-transfer-or-issue-card.dto';
import { PaymentDetailsDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/payment-details.dto';
import { ReissueCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/reissue-card.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import {
  IntersolveVisaPaymentInfoEnum,
  IntersolveVisaPaymentInfoEnumBackupName,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-payment-info.enum';
import { IntersolveVisaWalletStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-wallet-status.enum';
import { VisaErrorCodes } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/visa-error-codes.enum';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaCustomerRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.repository';
import { IntersolveVisaStatusMappingService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';

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
    // TODO: Replace this "auto generated" repo with a custom repo? How? See comment in IntersolveVisaCustomerRepository.
    @Inject(getScopedRepositoryProviderName(IntersolveVisaCustomerEntity))
    private intersolveVisaCustomerScopedRepository: ScopedRepository<IntersolveVisaCustomerEntity>,
    // TODO: Replace this "auto generated" repo with a custom repo? Once figured out how to do that for IntersolveVisaCustomerRepository, than also for IntersolveVisaParentWallet
    @Inject(getScopedRepositoryProviderName(IntersolveVisaParentWalletEntity))
    private intersolveVisaParentWalletScopedRepository: ScopedRepository<IntersolveVisaParentWalletEntity>,
    // TODO: Replace this "auto generated" repo with a custom repo? Once figured out how to do that for IntersolveVisaCustomerRepository, than also for IntersolveVisaParentWallet
    @Inject(getScopedRepositoryProviderName(IntersolveVisaChildWalletEntity))
    private intersolveVisaChildWalletScopedRepository: ScopedRepository<IntersolveVisaChildWalletEntity>,
    private readonly intersolveVisaCustomerRepository: IntersolveVisaCustomerRepository,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  private async createParentWallet(): Promise<void> {
    //TODO: Necessary to implement this function?
    throw new Error('Method not implemented.');
  }

  private async createChildWallet(): Promise<void> {
    //TODO: Necessary to implement this function?
    throw new Error('Method not implemented.');
  }

  public async getTransactionInfoByCustomer(
    visaCustomer: IntersolveVisaCustomerEntity,
  ) {
    const dateFrom = this.getTwoMonthAgo();

    for (const wallet of visaCustomer.intersolveVisaParentWallet
      .intersolveVisaChildWallets) {
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
    tokenCode: string | null,
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
    let walletReserveTransactions: IntersolveGetTransactionsResponseDataDto[] =
      [];
    let expiredReserveTransactions: IntersolveGetTransactionsResponseDataDto[] =
      [];
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

  // TODO: Remove this function, remaining logic (only add to queue stuff) goes into TransferQueuesService.addIntersolveVisaTransferJobs
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    //const paymentDetailsArray = await this.getPaPaymentDetails(paymentList);
    // for (const paymentDetails of paymentDetailsArray) {
    //   paymentDetails.programId = programId;
    //   paymentDetails.paymentNr = paymentNr;
    //   paymentDetails.bulkSize = paymentList[0].bulkSize;
    //   paymentDetails.programId = programId;
    //   const job = await this.paymentIntersolveVisaQueue.add(
    //     ProcessNamePayment.sendPayment,
    //     paymentDetails,
    //   );
    //   await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    // }
  }

  // TODO: Remove this function when its use has been refactored out.
  private async getTransactionAmountPerRegistration(
    maxAmount: number,
    wallet: IntersolveVisaChildWalletEntity,
    customer: IntersolveVisaCustomerEntity,
  ): Promise<number> {
    const _updatedWallet = await this.getUpdateWalletDetails(
      wallet,
      customer,
      true,
    );
    const calculatedAmount = this.calculateTopUpAmount();
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

  // TODO: Remove this function, it is replaced by this.doTransferOrIssueCard(), see comments in the function.
  /*
  public async processQueuedPayment(
    paymentDetailsData: PaymentDetailsDto,
  ): Promise<void> {
    // TODO: this.doTransferOrIssueCard() is implemented by changing around this.sendPaymentToPa
    const paymentRequestResultPerPa = await this.sendPaymentToPa(
      paymentDetailsData,
      paymentDetailsData.paymentNr,
      paymentDetailsData.transactionAmount,
      paymentDetailsData.bulkSize,
    );

    // TODO: Move the remainder of this function into this.doTransferOrIssueCard(), as far as still relevant. After that this whole function can be removed.
    const transactionRelationDetails: TransactionRelationDetailsDto = {
      programId: paymentDetailsData.programId,
      paymentNr: paymentDetailsData.paymentNr,
      userId: paymentDetailsData.userId,
    };

    await this.transactionsService.storeTransactionUpdateStatus(
      paymentRequestResultPerPa,
      transactionRelationDetails,
    );
  }*/

  // TODO: Remove this function (logic moves to PaymentsService.createIntersolveVisaTransferJobs and/or related private funcions in PaymentsService)
  /*
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

    return result;
  }*/

  // TODO: Remove this function (logic moves to PaymentsService.createIntersolveVisaTransferJobs and/or related private funcions in PaymentsService)
  private async getRelationOptionsForVisa(
    referenceId: string,
  ): Promise<RegistrationDataOptions[]> {
    const registration = await this.registrationScopedRepository.findOneOrFail({
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

  public async _doTransferOrIssueCard(
    _intersolveVisaTransferDto: IntersolveVisaDoTransferOrIssueCardDto,
  ): Promise<void> {
    /* TODO: Implement this function:
      - Remove _ from input parameter
      - This function is called by TransferJobsProcessorsService.processIntersolveVisaTransferJob()
      - This function takes an IntersolveVisaTransferDto as input parameter and returns a DoTransferReturnDto
      - This function is a re-implemetation of and optimization/refactoring of this.processQueuedPayment(), according to the new Intersolve Integration Manual.
      - See the "TO-BE" and "AS-IS" Sequence Diagrams for how we re-designed this function and the functions it calls.
      - Note: additional to the TO-BE sequence diagram, there may be optimization in refactoring what is done in this function into additional private functions, each with a single responsibility.
      - 
    */
    throw new Error('Method not implemented.');
  }

  // Instead of returning the generic PaTransactionResultDto, this function now returns a specific IntersolveVisaDoTransferOrIssueCardReturnDto
  // This should be fine, since the data is only used in the IntersolveVisa-specific transfer job processor method.
  // TODO: This function must return a IntersolveVisaDoTransferOrIssueCardReturnDto.
  public async doTransferOrIssueCard(
    intersolveVisaDoTransferOrIssueCardDto: IntersolveVisaDoTransferOrIssueCardDto,
  ): Promise<void> {
    // TODO: This variable is used here to retrieve an existing customer, but also later to put in a newly created customer. Is this the optimal way to code this? Re-using variables for different purposes? Check with Dom?
    let intersolveVisaCustomer =
      await this.intersolveVisaCustomerRepository.getIntersolveCustomerAndWalletsByRegistrationId(
        intersolveVisaDoTransferOrIssueCardDto.registrationId,
      );

    // Check if customer exists
    if (!intersolveVisaCustomer) {
      // If not, create customer
      const createCustomerDto: CreateCustomerDto = {
        externalReference: intersolveVisaDoTransferOrIssueCardDto.referenceId,
        name: intersolveVisaDoTransferOrIssueCardDto.name,
        street: intersolveVisaDoTransferOrIssueCardDto.street,
        houseNumber: intersolveVisaDoTransferOrIssueCardDto.houseNumber,
        houseNumberAddition:
          intersolveVisaDoTransferOrIssueCardDto.houseNumberAddition,
        postalCode: intersolveVisaDoTransferOrIssueCardDto.postalCode,
        city: intersolveVisaDoTransferOrIssueCardDto.city,
        phoneNumber: intersolveVisaDoTransferOrIssueCardDto.phoneNumber,
        estimatedAnnualPaymentVolumeMajorUnit: 12 * 44, // This is assuming 44 euro per month for a year for 1 child
      };

      const createCustomerResult =
        await this.intersolveVisaApiService.createCustomer(createCustomerDto);

      // if success, store customer
      intersolveVisaCustomer = new IntersolveVisaCustomerEntity();
      intersolveVisaCustomer.registrationId =
        intersolveVisaDoTransferOrIssueCardDto.registrationId;
      intersolveVisaCustomer.holderId = createCustomerResult.holderId;
      await this.intersolveVisaCustomerScopedRepository.save(
        intersolveVisaCustomer,
      );
    }

    // Check if a parent wallet exists
    if (!intersolveVisaCustomer.intersolveVisaParentWallet) {
      // TODO: Check if this is the correct way to check if the parent wallet does not exist
      // If not, create parent wallet
      const issueTokenDto: IssueTokenDto = {
        brandCode: intersolveVisaDoTransferOrIssueCardDto.brandCode,
        reference: intersolveVisaCustomer.holderId, // TODO: Why do we put the holderId here? Is that a requirement of the Intersolve API?
        activate: true, // Parent Wallets are always created activated
      };

      const issueTokenResult =
        await this.intersolveVisaApiService.issueToken(issueTokenDto);

      // Store parent wallet
      const intersolveVisaParentWallet = new IntersolveVisaParentWalletEntity();
      intersolveVisaParentWallet.intersolveVisaCustomer =
        intersolveVisaCustomer;
      intersolveVisaParentWallet.tokenCode = issueTokenResult.code;
      intersolveVisaParentWallet.lastExternalUpdate = new Date();
      await this.intersolveVisaParentWalletScopedRepository.save(
        intersolveVisaParentWallet,
      );

      intersolveVisaCustomer.intersolveVisaParentWallet =
        intersolveVisaParentWallet;
    }

    // Check if parent wallet is linked to customer
    if (
      !intersolveVisaCustomer.intersolveVisaParentWallet.isLinkedToVisaCustomer
    ) {
      // if not, link parent wallet to customer (registerHolder returns nothing if success and throw exception if failed)
      await this.intersolveVisaApiService.registerHolder(
        intersolveVisaCustomer.holderId,
        intersolveVisaCustomer.intersolveVisaParentWallet.tokenCode,
      );

      // Update parent wallet: set linkedToVisaCustomer to true
      intersolveVisaCustomer.intersolveVisaParentWallet.isLinkedToVisaCustomer =
        true;
      await this.intersolveVisaParentWalletScopedRepository.save(
        intersolveVisaCustomer.intersolveVisaParentWallet,
      );
    }

    // Check if at least one child wallet exists
    if (
      !intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets.length
    ) {
      // TODO: Check if this is the correct way to check if a child wallet does not exist
      // If not, create child wallet
      const issueTokenDto: IssueTokenDto = {
        brandCode: intersolveVisaDoTransferOrIssueCardDto.brandCode,
        reference: intersolveVisaCustomer.holderId, // TODO: Why do we put the holderId here? Is that a requirement of the Intersolve API?
        activate: false, // Child Wallets are always created deactivated
      };

      const issueTokenResult =
        await this.intersolveVisaApiService.issueToken(issueTokenDto);

      // Store child wallet
      const intersolveVisaChildWallet = new IntersolveVisaChildWalletEntity();
      intersolveVisaChildWallet.intersolveVisaParentWallet =
        intersolveVisaCustomer.intersolveVisaParentWallet;
      intersolveVisaChildWallet.tokenCode = issueTokenResult.code;
      intersolveVisaChildWallet.isTokenBlocked = issueTokenResult.blocked;
      intersolveVisaChildWallet.walletStatus =
        issueTokenResult.status as IntersolveVisaWalletStatus;
      intersolveVisaChildWallet.lastExternalUpdate = new Date();
      await this.intersolveVisaChildWalletScopedRepository.save(
        intersolveVisaChildWallet,
      );

      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.push(
        intersolveVisaChildWallet,
      );
    }

    // Sort wallets by newest creation date first, so that we can hereafter assume the first element represents the current wallet
    intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.sort(
      (a, b) => (a.created < b.created ? 1 : -1),
    );

    // Check if the newest child wallet is already linked to the parent wallet
    if (
      !intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets[0].isLinkedToParentWallet
    ) {
      // if not, link child wallet to parent wallet (linkToken returns nothing if success and throw exception if failed)
      await this.intersolveVisaApiService.linkToken(
        intersolveVisaCustomer.intersolveVisaParentWallet.tokenCode,
        intersolveVisaCustomer.intersolveVisaParentWallet
          .intersolveVisaChildWallets[0].tokenCode,
      );

      // Update child wallet: set linkedToParentWallet to true
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0].isLinkedToParentWallet =
        true;
      await this.intersolveVisaChildWalletScopedRepository.save(
        intersolveVisaCustomer.intersolveVisaParentWallet
          .intersolveVisaChildWallets[0],
      );
    }

    // Check if debit card is created
    if (
      !intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets[0].isDebitCardCreated
    ) {
      // If not, create debit card
      const createPhysicalCardDto: CreatePhysicalCardDto = {
        tokenCode:
          intersolveVisaCustomer.intersolveVisaParentWallet
            .intersolveVisaChildWallets[0].tokenCode,
        name: intersolveVisaDoTransferOrIssueCardDto.name,
        street: intersolveVisaDoTransferOrIssueCardDto.street,
        houseNumber: intersolveVisaDoTransferOrIssueCardDto.houseNumber,
        houseNumberAddition:
          intersolveVisaDoTransferOrIssueCardDto.houseNumberAddition,
        postalCode: intersolveVisaDoTransferOrIssueCardDto.postalCode,
        city: intersolveVisaDoTransferOrIssueCardDto.city,
        phoneNumber: intersolveVisaDoTransferOrIssueCardDto.phoneNumber,
        coverLetterCode: intersolveVisaDoTransferOrIssueCardDto.coverLetterCode,
      };

      await this.intersolveVisaApiService.createPhysicalCard(
        createPhysicalCardDto,
      );

      // If success, update child wallet: set isDebitCardCreated to true
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0].isDebitCardCreated =
        true;
      await this.intersolveVisaChildWalletScopedRepository.save(
        intersolveVisaCustomer.intersolveVisaParentWallet
          .intersolveVisaChildWallets[0],
      );

      // TODO: Add 'debit card created' atribute in resultDto of this function.
    }

    // Transfer money from the client's funding token to the parent token

    // Calculate the amount that should be paid out, taking the original calculatedAmount as MAX value.
    //let transferAmount;

    /* TODO: Old code below, useful while re-implementing and refactoring. Remove when done.

      try {
        transferAmount = await this.getTransactionAmountPerRegistration(
          calculatedAmount,
          intersolveVisaCustomer.visaWallets[0],
          intersolveVisaCustomer,
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
          intersolveVisaWalletTokenCode: intersolveVisaCustomer.visaWallets[0].tokenCode,
        };
        return paTransactionResult;
      

      paTransactionResult.calculatedAmount = transferAmount;
      // If calculatedAmount is larger than 0, call Intersolve
      if (transferAmount > 0) {
        const loadBalanceResult = await this.loadBalanceVisaCard(
          intersolveVisaCustomer.visaWallets[0].tokenCode,
          transferAmount,
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
        intersolveVisaWalletTokenCode:
          intersolveVisaCustomer.visaWallets[0].tokenCode,
      };

      transactionNotifications.push(
        this.buildNotificationObjectLoadBalance(
          transferAmount,
          bulkSizeCompletePayment,
        ),
      );
    }

    paTransactionResult.notificationObjects = transactionNotifications;
    return paTransactionResult;
    */
  }

  private async getCustomerEntity(
    registrationId: number,
  ): Promise<IntersolveVisaCustomerEntity | null> {
    return await this.intersolveVisaCustomerScopedRepository.findOne({
      relations: ['visaWallets'],
      where: { registrationId: registrationId },
    });
  }

  // TODO: Remove this function.
  /*
  private async createWallet(
    visaCustomer: IntersolveVisaCustomerEntity,
    calculatedAmount: number,
    programId: number,
  ): Promise<IssueTokenResponseDto> {
    const amountInCents = Math.round(calculatedAmount * 100);
    const createWalletPayload = new IssueTokenRequestDto();
    createWalletPayload.reference = visaCustomer.holderId;
    if (calculatedAmount > 0) {
      createWalletPayload.quantities = [
        {
          quantity: {
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE!,
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
  }*/

  // TODO: Remove this function.
  /*
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
  }*/

  // TODO: Remove this function.
  private async getBrandcodeForProgram(programId: number): Promise<string> {
    const brandCodeConfig =
      await this.programFspConfigurationRepository.findOne({
        where: {
          programId: programId,
          name: FinancialServiceProviderConfigurationEnum.brandCode,
          fsp: { fsp: FinancialServiceProviderName.intersolveVisa },
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
          name: FinancialServiceProviderConfigurationEnum.coverLetterCode,
          fsp: { fsp: FinancialServiceProviderName.intersolveVisa },
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
    tokenCode: string | null,
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
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE!,
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
    tokenCode: string | null,
    currentBalance: number,
  ): Promise<IntersolveLoadResponseDto> {
    const reference = uuid();
    const payload: IntersolveLoadDto = {
      reference: reference,
      quantities: [
        {
          quantity: {
            value: currentBalance,
            assetCode: process.env.INTERSOLVE_VISA_ASSET_CODE!,
          },
        },
      ],
    };
    return await this.intersolveVisaApiService.unloadBalanceCard(
      tokenCode,
      payload,
    );
  }

  // TODO: Remove this function from this service when all use is refactored out. This function has moved into IntersolveVisaApiService and refactored there.
  private intersolveErrorToMessage(errors: ErrorsInResponseDto[]): string {
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

  private async retrieveAndUpdateWalletsAndCard(
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity,
    intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<void> {
    // TODO: Implement this function. This function is the re-implementation and refactoring of the old this.getUpdateWalletDetails(). I think...

    // Update ParentWallet
    await this.retrieveAndUpdateParentWallet(intersolveVisaParentWallet);

    // Update Child Wallet and Card
    await this.retrieveAndUpdateChildWalletAndCard(intersolveVisaChildWallet);
  }

  private async retrieveAndUpdateParentWallet(
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity,
  ): Promise<void> {
    // TODO: Implement this method.

    // Get parent wallet info from Intersolve, we need: balance and spentThisMonth
    // Get balance by calling intersolveVisaApiService.getToken()
    const getTokenResult: GetTokenResultDto =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaParentWallet.tokenCode,
      );
    intersolveVisaParentWallet.balance = getTokenResult.balance;
    // HIER VERDER

    // Get spentThisMonth by calling intersolveVisaApiService.getTransactions() ??? Refactor code into a new function intersolveVisaApiService.getSpentThisMonth() ???
  }

  private async retrieveAndUpdateChildWalletAndCard(
    _intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<void> {
    // TODO: Implement this method.
    //await this.retrieveAndUpdateChildWalletAndCard(intersolveVisaChildWallet);
    // Get child wallet info from Intersolve, we need: wallet status, last used date, card status
    // TODO: Do we also want to update isTokenBlocked here, in case this became out-of-sync with our database?
  }

  // TODO: Remove this function when it is replaced by this.intersolveVisaApiService.retrieveAndUpdateWalletsAndCard. I think. Sort-of. At the moment.
  private async getUpdateWalletDetails(
    wallet: IntersolveVisaChildWalletEntity,
    customer: IntersolveVisaCustomerEntity,
    getPaymentDetailsOnly: boolean,
  ): Promise<IntersolveVisaChildWalletEntity> {
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
      // wallet.balance = walletData.balances.find(
      //   (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE,
      // ).quantity.value;
    }
    if (walletData?.status) {
      wallet.walletStatus = walletDetails.data.data.status ?? null;
    }
    if (walletData?.blocked === true || walletData?.blocked === false) {
      // wallet.tokenBlocked = walletDetails.data.data.blocked;
    }

    // Get spentThisMonth across all wallets of customer
    const transactionInfoByCustomer =
      await this.getTransactionInfoByCustomer(customer);

    if (transactionInfoByCustomer.length) {
      // wallet.spentThisMonth = transactionInfoByCustomer
      //   .map((w) => w.transactionInfo.spentThisMonth)
      //   .reduce((sum, current) => sum + current, 0);
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

    return await this.intersolveVisaChildWalletScopedRepository.save(wallet);
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

    for await (let wallet of visaCustomer.intersolveVisaParentWallet
      .intersolveVisaChildWallets) {
      wallet = await this.getUpdateWalletDetails(wallet, visaCustomer, false);

      const walletDetailsResponse = new GetWalletDetailsResponseDto();
      walletDetailsResponse.tokenCode = wallet.tokenCode;
      //walletDetailsResponse.balance = wallet.balance;

      // Map Intersolve status to 121 status for the frontend
      const statusInfo =
        this.intersolveVisaStatusMappingService.determine121StatusInfo(
          wallet.isTokenBlocked,
          wallet.walletStatus,
          wallet.cardStatus,
          wallet.tokenCode ===
            visaCustomer.intersolveVisaParentWallet
              .intersolveVisaChildWallets[0].tokenCode,
          {
            tokenCode: wallet.tokenCode ?? '',
            programId: programId,
            referenceId: referenceId,
          },
        );
      walletDetailsResponse.status = statusInfo.walletStatus121;
      walletDetailsResponse.explanation = statusInfo.explanation;
      walletDetailsResponse.links = statusInfo.links;
      walletDetailsResponse.issuedDate = wallet.created;
      walletDetailsResponse.lastUsedDate = wallet.lastUsedDate;
      //walletDetailsResponse.spentThisMonth = wallet.spentThisMonth;

      // These properties are not used in the frontend but are very useful for debugging
      walletDetailsResponse.intersolveVisaCardStatus =
        wallet.cardStatus ?? undefined;
      walletDetailsResponse.intersolveVisaWalletStatus =
        wallet.walletStatus ?? undefined;

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
    if (registration.fsp.fsp !== FinancialServiceProviderName.intersolveVisa) {
      const errors = `Registration with referenceId ${referenceId} is not an Intersolve Visa registration`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    if (!visaCustomer) {
      const errors = `${VisaErrorCodes.NoCustomerYet} with referenceId ${referenceId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    visaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.sort(
      (a, b) => (a.created > b.created ? -1 : 1),
    );
    return { registration: registration, visaCustomer: visaCustomer };
  }

  public async toggleBlockWallet(
    tokenCode: string | null,
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
        result.data?.code &&
        ['TOKEN_IS_ALREADY_BLOCKED', 'TOKEN_IS_NOT_BLOCKED'].includes(
          result.data.code,
        ))
    ) {
      await this.intersolveVisaChildWalletScopedRepository.updateUnscoped(
        { tokenCode: tokenCode },
        { isTokenBlocked: block },
      );
    }

    return result;
  }

  public async toggleBlockWalletNotification(
    tokenCode: string,
    block: boolean,
    programId: number,
  ): Promise<IntersolveBlockWalletResponseDto> {
    const qb = this.intersolveVisaParentWalletScopedRepository
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

    await this.queueMessageService.addMessageToQueue({
      registration: wallet.intersolveVisaCustomer.registration,
      messageTemplateKey: notificationKey,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    });
    return result;
  }

  private createCustomerAddressPayload(
    paymentDetails: PaymentDetailsDto,
  ): AddressDto {
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
    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: referenceId, programId: programId },
    });
    const visaCustomer = await this.getCustomerEntity(registration.id);

    const errors: string[] = [];

    const phoneNumberPayload: CreateCustomerResponseExtensionDto = {
      type: 'MOBILE',
      value: registration.phoneNumber,
    };
    const phoneNumberResult =
      await this.intersolveVisaApiService.updateCustomerPhoneNumber(
        visaCustomer?.holderId ?? null,
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
          visaCustomer?.holderId ?? null,
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

  // TODO: Re-implement and refactor this function. Commenting out now completely, since it does not compile.
  public async reissueWalletAndCard(
    _referenceId: string,
    _programId: number,
  ): Promise<any> {
    /*
    const { registration: _registration, visaCustomer } =
      await this.getRegistrationAndVisaCustomer(referenceId, programId);
    if (visaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.length === 0) {
      const errors = `No wallet available yet for PA with this referenceId ${referenceId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const oldWallets = visaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.sort((a, b) =>
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
    const getWalletResponse = await this.intersolveVisaApiService.getToken(
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
    const currentBalance =
      getWalletResponse.data.data.balances?.find(
        (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE!,
      )?.quantity.value ?? 0;

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
    newWallet.tokenBlocked = createWalletResult.data.data.token.blocked ?? null;
    newWallet.intersolveVisaCustomer = visaCustomer;
    newWallet.walletStatus = createWalletResult.data.data.token
      .status as IntersolveVisaWalletStatus;
    newWallet.balance =
      createWalletResult.data.data.token.balances?.find(
        (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE!,
      )?.quantity.value ?? null;
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
      programId,
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
    */
  }

  // TODO: REFACTOR: Remove this method, the message is sent from RegistrationsService.sendMessageReissueCard()
  private async sendMessageReissueCard(
    referenceId: string,
    programId: number,
  ): Promise<void> {
    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: referenceId, programId: programId },
    });
    await this.queueMessageService.addMessageToQueue({
      registration,
      messageTemplateKey: ProgramNotificationEnum.reissueVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    });
  }

  private async tryToBlockWallet(tokenCode: string | null): Promise<void> {
    try {
      await this.toggleBlockWallet(tokenCode, true);
    } catch (e) {
      console.log('error: ', e);
    }
  }

  public async updateVisaDebitWalletDetails(): Promise<void> {
    // NOTE: This currently happens for all the Visa Wallets across programs/instances
    const customerWithWallets =
      await this.intersolveVisaCustomerScopedRepository.find({
        relations: ['visaWallets'],
      });
    for (const customer of customerWithWallets) {
      for (const wallet of customer.intersolveVisaParentWallet
        .intersolveVisaChildWallets) {
        await this.getUpdateWalletDetails(wallet, customer, false);
      }
    }
  }

  public async hasIntersolveCustomer(registrationId: number): Promise<boolean> {
    const count = await this.intersolveVisaCustomerScopedRepository
      .createQueryBuilder('customer')
      .andWhere('customer.registrationId = :registrationId', { registrationId })
      .getCount();
    return count > 0;
  }

  // TODO: Remove this function from this service when all use is refactored out. This function has moved into IntersolveVisaApiService.
  private isSuccessResponseStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  public async reissueCard(_reissueCardDto: ReissueCardDto): Promise<void> {
    /* TODO: Implement this function:
      - Add a ResponseDto
      - See Sequence Diagram in Miro Scratch Board.
      - Remove _ from input parameter
      - This function is called by RegistrationsService.reissueCard()
      - This function takes an ReissueCardDto as input parameter
      - This function is a re-implementation and optimization/refactoring of this.reissueWalletAndCard(), according to the new Intersolve Integration Manual.
      - See the "TO-BE" and "AS-IS" Sequence Diagrams for how we re-designed this function and the functions it calls.
      - Note: additional to the TO-BE sequence diagram, there may be optimization in refactoring what is done in this function into additional private functions, each with a single responsibility.
      -
    */
    throw new Error('Method not implemented.');
  }

  // TODO: This function moved from IntersolveVisaWalletEntity to here. Refactor this function and remove this comment.
  private calculateTopUpAmount(): number {
    /*return (
        (maximumAmountOfSpentCentPerMonth - this.spentThisMonth - this.balance) /
        100
      );*/
    throw new Error('Method not implemented.');
  }
}
