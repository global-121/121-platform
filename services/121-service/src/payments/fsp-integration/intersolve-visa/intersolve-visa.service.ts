import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { CreateCustomerDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-customer.dto';
import { CreatePhysicalCardDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/create-physical-card.dto';
import { GetPhysicalCardReturnDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-physical-card-return.dto';
import { GetTokenResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-token-result.dto';
import { GetTransactionInformationResultDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/get-transaction-information-result.dto';
import { AddressDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-request.dto';
import { CreateCustomerResponseExtensionDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/create-customer-response.dto';
import { IssueTokenDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/issue-token.dto';
import {
  GetWalletDetailsResponseDto,
  GetWalletsResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-details.dto';
import { IntersolveVisaDoTransferOrIssueCardReturnDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-do-transfer-or-issue-card-return.dto';
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
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';
import { VisaErrorCodes } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/visa-error-codes.enum';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';
import { IntersolveVisaStatusMappingService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';
import { RegistrationDataOptions } from '@121-service/src/registration/dto/registration-data-relation.model';
import { Attributes } from '@121-service/src/registration/dto/update-registration.dto';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { ErrorEnum } from '@121-service/src/registration/errors/registration-data.error';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

@Injectable()
export class IntersolveVisaService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly registrationDataQueryService: RegistrationDataScopedQueryService,
    private readonly intersolveVisaStatusMappingService: IntersolveVisaStatusMappingService,
    private readonly queueMessageService: QueueMessageService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly intersolveVisaCustomerScopedRepository: IntersolveVisaCustomerScopedRepository,
    private readonly intersolveVisaParentWalletScopedRepository: IntersolveVisaParentWalletScopedRepository,
    private readonly intersolveVisaChildWalletScopedRepository: IntersolveVisaChildWalletScopedRepository,
  ) {}

  // TODO: Remove this function when refactored out of all FSP integrations.
  public async sendPayment(
    _paPaymentArray: PaPaymentDataDto[],
    _programId: number,
    _payment: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  // TODO: This function needs to be removed to the PaymentsService.
  public async getQueueProgress(programId?: number): Promise<number> {
    if (programId) {
      // Get the count of job IDs in the Redis set for the program
      //const count = await this.redisClient.scard(getRedisSetName(programId));
      return 0;
    } else {
      // If no programId is provided, use Bull's method to get the total delayed count
      // This requires an instance of the Bull queue

      // TODO: Find out how to get the total delayed count without an instance of the queue
      // const delayedCount =
      //   await this.paymentIntersolveVisaQueue.getDelayedCount();
      const delayedCount = 0;
      return delayedCount;
    }
  }

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

  // TODO: REFACTOR: See Dom's suggestion: https://gist.github.com/aberonni/afed0df72b77f0d1c71f454b7c1f7098
  public async doTransferOrIssueCard(
    input: IntersolveVisaDoTransferOrIssueCardDto,
  ): Promise<IntersolveVisaDoTransferOrIssueCardReturnDto> {
    const returnData = new IntersolveVisaDoTransferOrIssueCardReturnDto();

    let intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneAndWalletsByRegistrationId(
        input.registrationId,
      );

    // Check if customer exists
    if (!intersolveVisaCustomer) {
      // If not, create customer
      const createCustomerDto: CreateCustomerDto = {
        externalReference: input.reference,
        name: input.name,
        addressStreet: input.addressStreet,
        addressHouseNumber: input.addressHouseNumber,
        // TODO: Check if this is the correct way to handle optional fields
        addressHouseNumberAddition: input.addressHouseNumberAddition!,
        addressPostalCode: input.addressPostalCode,
        addressCity: input.addressCity,
        phoneNumber: input.phoneNumber,
        estimatedAnnualPaymentVolumeMajorUnit: 12 * 44, // This is assuming 44 euro per month for a year for 1 child
      };

      const createCustomerResult =
        await this.intersolveVisaApiService.createCustomer(createCustomerDto);

      // if success, store customer
      const newIntersolveVisaCustomer = new IntersolveVisaCustomerEntity();
      newIntersolveVisaCustomer.registrationId = input.registrationId;
      newIntersolveVisaCustomer.holderId = createCustomerResult.holderId;
      intersolveVisaCustomer =
        await this.intersolveVisaCustomerScopedRepository.save(
          newIntersolveVisaCustomer,
        );
    }

    // Check if a parent wallet exists
    if (!intersolveVisaCustomer.intersolveVisaParentWallet) {
      // If not, create parent wallet

      // TODO: Add object into functions that have a DTO as parameter, instead of first creating the object and then passing it into the function. => everywhere

      const issueTokenResult = await this.intersolveVisaApiService.issueToken({
        brandCode: input.brandCode,
        activate: true, // Parent Wallets are always created activated
      });

      // Store parent wallet
      const newIntersolveVisaParentWallet =
        new IntersolveVisaParentWalletEntity();
      newIntersolveVisaParentWallet.intersolveVisaCustomer =
        intersolveVisaCustomer;
      newIntersolveVisaParentWallet.tokenCode = issueTokenResult.code;
      newIntersolveVisaParentWallet.lastExternalUpdate = new Date();
      intersolveVisaCustomer.intersolveVisaParentWallet =
        await this.intersolveVisaParentWalletScopedRepository.save(
          newIntersolveVisaParentWallet,
        );
    }

    // Check if parent wallet is linked to customer
    if (
      !intersolveVisaCustomer.intersolveVisaParentWallet.isLinkedToVisaCustomer
    ) {
      // if not, link parent wallet to customer (registerHolder returns nothing if success and throw exception if failed)
      await this.intersolveVisaApiService.registerHolder({
        holderId: intersolveVisaCustomer.holderId,
        tokenCode: intersolveVisaCustomer.intersolveVisaParentWallet.tokenCode,
      });

      // Update parent wallet: set linkedToVisaCustomer to true
      intersolveVisaCustomer.intersolveVisaParentWallet.isLinkedToVisaCustomer =
        true;
      intersolveVisaCustomer.intersolveVisaParentWallet =
        await this.intersolveVisaParentWalletScopedRepository.save(
          intersolveVisaCustomer.intersolveVisaParentWallet,
        );
    }

    // Check if at least one child wallet exists
    if (
      !intersolveVisaCustomer.intersolveVisaParentWallet
        ?.intersolveVisaChildWallets?.length
    ) {
      // TODO: Check if this is the correct way to check if a child wallet does not exist
      // If not, create child wallet
      const issueTokenDto: IssueTokenDto = {
        brandCode: input.brandCode,
        activate: false, // Child Wallets are always created deactivated
      };

      const issueTokenResult =
        await this.intersolveVisaApiService.issueToken(issueTokenDto);

      // Store child wallet
      const newIntersolveVisaChildWallet =
        new IntersolveVisaChildWalletEntity();
      newIntersolveVisaChildWallet.intersolveVisaParentWallet =
        intersolveVisaCustomer.intersolveVisaParentWallet;
      newIntersolveVisaChildWallet.tokenCode = issueTokenResult.code;
      newIntersolveVisaChildWallet.isTokenBlocked = issueTokenResult.blocked;
      newIntersolveVisaChildWallet.walletStatus =
        issueTokenResult.status as IntersolveVisaTokenStatus;
      newIntersolveVisaChildWallet.lastExternalUpdate = new Date();
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets =
        [];
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.push(
        await this.intersolveVisaChildWalletScopedRepository.save(
          newIntersolveVisaChildWallet,
        ),
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
      await this.intersolveVisaApiService.linkToken({
        parentTokenCode:
          intersolveVisaCustomer.intersolveVisaParentWallet.tokenCode,
        childTokenCode:
          intersolveVisaCustomer.intersolveVisaParentWallet
            .intersolveVisaChildWallets[0].tokenCode,
      });

      // Update child wallet: set linkedToParentWallet to true
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0].isLinkedToParentWallet =
        true;
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0] =
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
        name: input.name,
        addressStreet: input.addressStreet,
        addressHouseNumber: input.addressHouseNumber,
        addressHouseNumberAddition: input.addressHouseNumberAddition,
        addressPostalCode: input.addressPostalCode,
        addressCity: input.addressCity,
        phoneNumber: input.phoneNumber,
        coverLetterCode: input.coverLetterCode,
      };

      await this.intersolveVisaApiService.createPhysicalCard(
        createPhysicalCardDto,
      );

      // If success, update child wallet: set isDebitCardCreated to true
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0].isDebitCardCreated =
        true;
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0] =
        await this.intersolveVisaChildWalletScopedRepository.save(
          intersolveVisaCustomer.intersolveVisaParentWallet
            .intersolveVisaChildWallets[0],
        );

      returnData.cardCreated = true;
    }

    // If there are any child wallets no-matter the status, retrieve latest information of the wallets and card from intersolve before calculating transfer amount from them.
    if (
      intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets
    ) {
      intersolveVisaCustomer.intersolveVisaParentWallet =
        await this.retrieveAndUpdateParentWallet(
          intersolveVisaCustomer.intersolveVisaParentWallet,
        );
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0] =
        await this.retrieveAndUpdateChildWallet(
          intersolveVisaCustomer.intersolveVisaParentWallet
            .intersolveVisaChildWallets[0],
        );
    }

    // Calculate the amount that should be transfered
    const transferAmount = this.calculateLimitedTransferAmount({
      transactionAmount: input.transferAmount,
      spentThisMonth:
        intersolveVisaCustomer.intersolveVisaParentWallet.spentThisMonth,
      balance: intersolveVisaCustomer.intersolveVisaParentWallet.balance,
    });

    // Transfer money from the client's funding token to the parent token
    if (transferAmount > 0) {
      await this.intersolveVisaApiService.transfer({
        fromTokenCode: input.fundingTokenCode,
        toTokenCode:
          intersolveVisaCustomer.intersolveVisaParentWallet.tokenCode,
        amount: transferAmount,
      });
      returnData.transferDone = true;
      returnData.amountTransferred = transferAmount;
    }

    return returnData;
  }

  private async retrieveAndUpdateParentWallet(
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity,
  ): Promise<IntersolveVisaParentWalletEntity> {
    // Get balance on the parent wallet
    const getTokenResult: GetTokenResultDto =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaParentWallet.tokenCode,
      );

    // Get parent wallet transaction info from Intersolve
    const getTransactionInformationResultDto: GetTransactionInformationResultDto =
      await this.intersolveVisaApiService.getTransactionInformation(
        intersolveVisaParentWallet.tokenCode,
      );

    // Update the parent wallet in the database
    intersolveVisaParentWallet.balance = getTokenResult.balance;
    intersolveVisaParentWallet.lastUsedDate =
      getTransactionInformationResultDto.lastTransactionDate;
    intersolveVisaParentWallet.spentThisMonth =
      getTransactionInformationResultDto.spentThisMonth;
    intersolveVisaParentWallet.lastExternalUpdate = new Date();
    intersolveVisaParentWallet =
      await this.intersolveVisaParentWalletScopedRepository.save(
        intersolveVisaParentWallet,
      );
    return intersolveVisaParentWallet;
  }

  public async retrieveAndUpdateChildWallet(
    intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<IntersolveVisaChildWalletEntity> {
    // TODO: Implement this method.

    // Get child wallet information
    const getTokenResult: GetTokenResultDto =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaChildWallet.tokenCode,
      );

    // Get card status
    const GetPhysicalCardReturnDto: GetPhysicalCardReturnDto =
      await this.intersolveVisaApiService.getPhysicalCard(
        intersolveVisaChildWallet.tokenCode,
      );

    intersolveVisaChildWallet.walletStatus = getTokenResult.status;
    intersolveVisaChildWallet.isTokenBlocked = getTokenResult.blocked;
    intersolveVisaChildWallet.cardStatus = GetPhysicalCardReturnDto.status;
    intersolveVisaChildWallet.lastExternalUpdate = new Date();

    intersolveVisaChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(
        intersolveVisaChildWallet,
      );
    return intersolveVisaChildWallet;
  }

  // TODO: Fix and this function as code it depends on has changed with the Visa re-implementation.
  // TODO: Re-implement and refactor this function according to new Module dependency model and encapsulate API details in IntersolveVisaApiService
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
      //wallet = await this.getUpdateWalletDetails(wallet, visaCustomer, false); // Temp fix this line with the next:
      wallet = new IntersolveVisaChildWalletEntity();

      const walletDetailsResponse = new GetWalletDetailsResponseDto();
      walletDetailsResponse.tokenCode = wallet.tokenCode ?? undefined;
      //walletDetailsResponse.balance = wallet.balance ?? undefined;

      // Map Intersolve status to 121 status for the frontend
      const statusInfo =
        this.intersolveVisaStatusMappingService.determine121StatusInfo(
          wallet.isTokenBlocked ?? false,
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
      //walletDetailsResponse.lastUsedDate = wallet.lastUsedDate;
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

  // TODO: Fix and this function as code it depends on has changed with the Visa re-implementation.
  // TODO: Re-implement and refactor this function according to new Module dependency model and encapsulate API details in IntersolveVisaApiService
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

    const visaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneAndWalletsByRegistrationId(
        registration.id,
      );
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

  // TODO: Re-implement and refactor this function according to new Module dependency model and encapsulate API details in IntersolveVisaApiService
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

  // TODO: Re-implement and refactor this function according to new Module dependency model and encapsulate API details in IntersolveVisaApiService
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
    const visaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneAndWalletsByRegistrationId(
        registration.id,
      );

    const errors: string[] = [];

    const phoneNumberPayload: CreateCustomerResponseExtensionDto = {
      type: 'MOBILE',
      value: registration.phoneNumber,
    };
    const phoneNumberResult =
      await this.intersolveVisaApiService.updateCustomerPhoneNumber({
        holderId: visaCustomer?.holderId ?? null,
        payload: phoneNumberPayload,
      });
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
        await this.intersolveVisaApiService.updateCustomerAddress({
          holderId: visaCustomer?.holderId ?? null,
          payload: addressPayload,
        });
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

  // TODO: Re-implement and refactor this function into the new this.reissueCard().
  public async reissueWalletAndCard(
    referenceId: string,
    programId: number,
  ): Promise<any> {
    // Deleted all code for now, so it compiles.
    console.log('reissueWalletAndCard' + referenceId + programId);
  }

  public async reissueCard(input: ReissueCardDto): Promise<void> {
    // TODO: REFACTOR: See Dom's suggestion: https://gist.github.com/aberonni/afed0df72b77f0d1c71f454b7c1f7098
    const intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneAndWalletsByRegistrationId(
        input.registrationId,
      );

    if (!intersolveVisaCustomer) {
      throw new Error(
        'This Registration does not have an Intersolve Visa Customer. Cannot reissue card.',
      );
    }
    if (!intersolveVisaCustomer.intersolveVisaParentWallet) {
      throw new Error(
        'This Registration does not have an Intersolve Visa Parent Wallet. Cannot reissue card.',
      );
    }
    if (
      !intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets.length
    ) {
      throw new Error(
        'This Registration does not have an Intersolve Visa Child Wallet. Cannot reissue card.',
      );
    }
    // Sort wallets by newest creation date first, so that we can hereafter assume the first element represents the current wallet
    intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.sort(
      (a, b) => (a.created < b.created ? 1 : -1),
    );
    let childWalletToReplace =
      intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets[0];

    if (!childWalletToReplace.isDebitCardCreated) {
      throw new Error(
        'This Intersolve Visa Child Wallet to be replaced does not have a card created for it. Cannot reissue card.',
      );
    }
    // Update Customer at Intersolve with the received address and phone number, to make sure that any old data at Intersolve is replaced.
    // TODO: Add a call to the new this.syncIntersolveCustomerWith121() function here. Creating this function is part of the re-implementation of sending data to Intersolve after Registration changes.

    if (childWalletToReplace.isTokenBlocked) {
      // TODO: Call function to unblock wallet, re-implemented in the Pause card Task.
      this.intersolveVisaApiService.setTokenBlocked(
        childWalletToReplace.tokenCode,
        false,
      );
    }

    // Create new token at Intersolve
    const issueTokenDto: IssueTokenDto = {
      brandCode: input.brandCode,
      activate: false, // Child Wallets are always created deactivated
    };

    const issueTokenResult =
      await this.intersolveVisaApiService.issueToken(issueTokenDto);

    // Create child wallet entity
    const newIntersolveVisaChildWallet = new IntersolveVisaChildWalletEntity();
    newIntersolveVisaChildWallet.intersolveVisaParentWallet =
      intersolveVisaCustomer.intersolveVisaParentWallet;
    newIntersolveVisaChildWallet.tokenCode = issueTokenResult.code;
    newIntersolveVisaChildWallet.isTokenBlocked = issueTokenResult.blocked;
    newIntersolveVisaChildWallet.walletStatus =
      issueTokenResult.status as IntersolveVisaTokenStatus;
    newIntersolveVisaChildWallet.lastExternalUpdate = new Date();
    let newChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(
        newIntersolveVisaChildWallet,
      );
    intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.push(
      newChildWallet,
    );

    // Substitute the old token with the new token at Intersolve
    await this.intersolveVisaApiService.substituteToken(
      childWalletToReplace.tokenCode,
      newChildWallet.tokenCode,
    );

    // Update old child wallet: set status to SUBSTITUTED
    childWalletToReplace.walletStatus = IntersolveVisaTokenStatus.Substituted;
    childWalletToReplace =
      await this.intersolveVisaChildWalletScopedRepository.save(
        childWalletToReplace,
      );

    // Update new child wallet: set linkedToParentWallet to true
    newChildWallet.isLinkedToParentWallet = true;
    newChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(newChildWallet);

    // Create new card
    await this.intersolveVisaApiService.createPhysicalCard({
      tokenCode: newChildWallet.tokenCode,
      name: input.name,
      addressStreet: input.addressStreet,
      addressHouseNumber: input.addressHouseNumber,
      addressHouseNumberAddition: input.addressHouseNumberAddition,
      addressPostalCode: input.addressPostalCode,
      addressCity: input.addressCity,
      phoneNumber: input.phoneNumber,
      coverLetterCode: input.coverLetterCode,
    });

    // Update child wallet: set isDebitCardCreated to true
    newChildWallet.isDebitCardCreated = true;
    newChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(newChildWallet);
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

  // TODO: Re-implement and refactor this function according to the new Visa Integration Manual.
  public async updateVisaDebitWalletDetails(): Promise<void> {
    // NOTE: This currently happens for all the Visa Wallets across programs/instances
    const customerWithWallets =
      await this.intersolveVisaCustomerScopedRepository.find({
        relations: ['visaWallets'],
      });
    for (const customer of customerWithWallets) {
      for (const wallet of customer.intersolveVisaParentWallet
        .intersolveVisaChildWallets) {
        //await this.getUpdateWalletDetails(wallet, customer, false);
        console.log(wallet);
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

  // Calculated the amount that can be transferred based on the limits of maxumum amount on a wallet and maximum amount that can be spent per month.
  private calculateLimitedTransferAmount({
    transactionAmount,
    spentThisMonth,
    balance,
  }: {
    transactionAmount: number;
    spentThisMonth: number;
    balance: number;
  }): number {
    const calculatedAmount =
      (maximumAmountOfSpentCentPerMonth - spentThisMonth - balance) / 100;

    if (calculatedAmount > 0) {
      return Math.min(calculatedAmount, transactionAmount);
    } else {
      return 0;
    }
  }

  public async pauseCardOrThrow(
    tokenCode: string,
    pause: boolean,
  ): Promise<IntersolveVisaChildWalletEntity> {
    const wallet =
      await this.intersolveVisaChildWalletScopedRepository.findOneOrFail({
        where: { tokenCode: Equal(tokenCode) },
      });
    if (wallet.isTokenBlocked === pause) {
      throw new Error(`Token is already ${pause ? 'blocked' : 'unblocked'}`);
    }
    await this.intersolveVisaApiService.setTokenBlocked(tokenCode, pause);
    wallet.isTokenBlocked = pause;
    return await this.intersolveVisaChildWalletScopedRepository.save(wallet);
  }
}
