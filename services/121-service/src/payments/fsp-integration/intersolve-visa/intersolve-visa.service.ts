import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { CreatePhysicalCardParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/create-physical-card-params.interface';
import { DoTransferOrIssueCardParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-params.interface';
import { DoTransferOrIssueCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-return-type.interface';
import { GetPhysicalCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-physical-card-return-type.interface';
import { GetTokenReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-token-return-type.interface';
import { GetTransactionInformationReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-transaction-information-return-type.interface';
import { ReissueCardParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/reissue-card-params.interface';
import { SendUpdatedContactInformationParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/send-updated-contact-information-params.interface';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaDtoMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-dto.mapper';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

@Injectable()
export class IntersolveVisaService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
    private readonly intersolveVisaCustomerScopedRepository: IntersolveVisaCustomerScopedRepository,
    private readonly intersolveVisaParentWalletScopedRepository: IntersolveVisaParentWalletScopedRepository,
    private readonly intersolveVisaChildWalletScopedRepository: IntersolveVisaChildWalletScopedRepository,
  ) {}

  // TODO: Remove this function when refactored out of all FSP integrations.
  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
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

  // TODO: REFACTOR: See Dom's suggestion: https://gist.github.com/aberonni/afed0df72b77f0d1c71f454b7c1f7098 ####
  /**
   * This function handles the process of transferring money to a person using intersolve visa.
   * - It first checks if the customer exists, if not it creates a new customer.
   * - Then it checks if a parent wallet exists, if not it creates a new parent wallet.
   * - Then it checks if the parent wallet is linked to the customer, if not it links the parent wallet to the customer.
   * - Then it checks if at least one child wallet exists, if not it creates a new child wallet.
   * - Then it checks if the child wallet is linked to the parent wallet, if not it links the child wallet to the parent wallet.
   * - Then it checks if a debit card is created, if not it creates a new debit card.
   * - Finally, it transfers money from the client's funding token to the parent token.
   *
   * @param {DoTransferOrIssueCardParams} input - The parameters for the transfer or card issuance.
   * @returns {Promise<DoTransferOrIssueCardReturnType>} The result of the operation, including whether a card was created, whether a transfer was done, and the amount transferred in major units.
   */
  public async doTransferOrIssueCard(
    input: DoTransferOrIssueCardParams,
  ): Promise<DoTransferOrIssueCardReturnType> {
    // TODO: Is this the desired way of initializing the return data?
    const returnData: DoTransferOrIssueCardReturnType = {
      cardCreated: false,
      transferDone: false,
      amountTransferredInMajorUnit: 0,
    };

    let intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneWithWalletsByRegistrationId(
        input.registrationId,
      );

    // Check if customer exists
    if (!intersolveVisaCustomer) {
      // If not, create customer
      const createCustomerResult =
        await this.intersolveVisaApiService.createCustomer({
          externalReference: input.createCustomerReference,
          name: input.name,
          contactInformation: {
            addressStreet: input.contactInformation.addressStreet,
            addressHouseNumber: input.contactInformation.addressHouseNumber,
            addressHouseNumberAddition:
              input.contactInformation.addressHouseNumberAddition,
            addressPostalCode: input.contactInformation.addressPostalCode,
            addressCity: input.contactInformation.addressCity,
            phoneNumber: input.contactInformation.phoneNumber,
          },
          estimatedAnnualPaymentVolumeMajorUnit: 12 * 44 * 100, // This is assuming 44 euro per month for a year for 1 child; Assuming this parameter is in cents
        });

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

      const issueTokenResult = await this.intersolveVisaApiService.issueToken({
        brandCode: input.brandCode,
        activate: true, // Parent Wallets are always created activated
        reference: process.env.MOCK_INTERSOLVE
          ? intersolveVisaCustomer.holderId
          : undefined,
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
      const issueTokenResult = await this.intersolveVisaApiService.issueToken({
        brandCode: input.brandCode,
        activate: false, // Child Wallets are always created deactivated
        reference: process.env.MOCK_INTERSOLVE
          ? intersolveVisaCustomer.holderId
          : undefined,
      });

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
      const createPhysicalCardDto: CreatePhysicalCardParams = {
        tokenCode:
          intersolveVisaCustomer.intersolveVisaParentWallet
            .intersolveVisaChildWallets[0].tokenCode,
        name: input.name,
        contactInformation: {
          addressStreet: input.contactInformation.addressStreet,
          addressHouseNumber: input.contactInformation.addressHouseNumber,
          addressHouseNumberAddition:
            input.contactInformation.addressHouseNumberAddition,
          addressPostalCode: input.contactInformation.addressPostalCode,
          addressCity: input.contactInformation.addressCity,
          phoneNumber: input.contactInformation.phoneNumber,
        },
        coverLetterCode: input.coverLetterCode,
      };

      await this.intersolveVisaApiService.createPhysicalCard(
        createPhysicalCardDto,
      );

      // If success, update child wallet: set isDebitCardCreated to true
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0].isDebitCardCreated =
        true;
      // TODO: Find out if it's safe to assume that cards that receive a 200 on createPhysicalCard are always CardOk ####
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0].cardStatus =
        IntersolveVisaCardStatus.CardOk;
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0] =
        await this.intersolveVisaChildWalletScopedRepository.save(
          intersolveVisaCustomer.intersolveVisaParentWallet
            .intersolveVisaChildWallets[0],
        );

      returnData.cardCreated = true;
    }

    // Transfer money from the client's funding token to the parent token
    if (input.transferAmountInMajorUnit > 0) {
      await this.intersolveVisaApiService.transfer({
        fromTokenCode: input.fundingTokenCode,
        toTokenCode:
          intersolveVisaCustomer.intersolveVisaParentWallet.tokenCode,
        amount: input.transferAmountInMajorUnit,
        reference: input.transferReference,
      });
      returnData.transferDone = true;
      returnData.amountTransferredInMajorUnit = input.transferAmountInMajorUnit;
    }

    return returnData;
  }

  /**
   * This function retrieves and updates the wallet information for a given registration ID.
   * - The function first retrieves and updates the parent wallet from Intersolve. This includes first get token information and then get transaction information from intersolve.
   * - It also retrieves and updates all non-substituted child wallets associated with the parent wallet.
   * - Finally, it returns the updated wallet information as a DTO.
   *
   * @param {number} registrationId - The registration ID for which to retrieve and update the wallet.
   * @throws {HttpException} Throws an HttpException if no customer or parent wallet is found for the given registration ID.
   * @returns {Promise<IntersolveVisaWalletDto>} The updated wallet information as a DTO.
   */
  public async retrieveAndUpdateWallet(
    registrationId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const customer =
      await this.intersolveVisaCustomerScopedRepository.findOneWithWalletsByRegistrationId(
        registrationId,
      );

    if (!customer) {
      throw new HttpException(
        {
          errors: `No Customer Entity found for Registration: ${registrationId}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (!customer.intersolveVisaParentWallet) {
      throw new HttpException(
        {
          errors: `No ParentWallet Entity found for Registration: ${registrationId}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Retrieve and update the parent wallet from Intersolve
    const intersolveVisaParentWallet = await this.retrieveAndUpdateParentWallet(
      customer.intersolveVisaParentWallet,
    );

    // Retrieve and update the current wallet from Intersolve (= skip all substituted wallets)
    for (const childWallet of customer.intersolveVisaParentWallet
      .intersolveVisaChildWallets) {
      if (childWallet.walletStatus !== IntersolveVisaTokenStatus.Substituted) {
        await this.retrieveAndUpdateChildWallet(childWallet);
      }
    }

    return IntersolveVisaDtoMapper.mapParentWalletEntityToWalletDto(
      intersolveVisaParentWallet,
    );
  }

  /**
   * This function retrieves the wallet and associated childwallets/cards for a given registration ID. It does not update the wallet information using Intersolve.
   *
   * @param {number} registrationId - The registration ID for which to retrieve the wallet and cards.
   * @throws {HttpException} Throws an HttpException if no customer or parent wallet is found for the given registration ID.
   * @returns {Promise<IntersolveVisaWalletDto>} The wallet and associated cards information as a DTO.
   */
  public async getWalletWithCards(
    registrationId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const customer =
      await this.intersolveVisaCustomerScopedRepository.findOneWithWalletsByRegistrationId(
        registrationId,
      );

    if (!customer) {
      throw new HttpException(
        {
          errors: `No Customer Entity found for Registration: ${registrationId}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (!customer.intersolveVisaParentWallet) {
      throw new HttpException(
        {
          errors: `No ParentWallet Entity found for Registration: ${registrationId}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return IntersolveVisaDtoMapper.mapParentWalletEntityToWalletDto(
      customer.intersolveVisaParentWallet,
    );
  }

  private async retrieveAndUpdateParentWallet(
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity,
  ): Promise<IntersolveVisaParentWalletEntity> {
    // Get balance on the parent wallet
    const getTokenResult: GetTokenReturnType =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaParentWallet.tokenCode,
      );

    // Get parent wallet transaction info from Intersolve
    const getTransactionInformationResultDto: GetTransactionInformationReturnType =
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

  private async retrieveAndUpdateChildWallet(
    intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<IntersolveVisaChildWalletEntity> {
    // Get child wallet information
    const getTokenResult: GetTokenReturnType =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaChildWallet.tokenCode,
      );

    // Get card status
    if (intersolveVisaChildWallet.isDebitCardCreated) {
      const GetPhysicalCardReturnDto: GetPhysicalCardReturnType =
        await this.intersolveVisaApiService.getPhysicalCard(
          intersolveVisaChildWallet.tokenCode,
        );
      intersolveVisaChildWallet.cardStatus = GetPhysicalCardReturnDto.status;
    }

    intersolveVisaChildWallet.walletStatus = getTokenResult.status;
    intersolveVisaChildWallet.isTokenBlocked = getTokenResult.blocked;
    intersolveVisaChildWallet.lastExternalUpdate = new Date();

    intersolveVisaChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(
        intersolveVisaChildWallet,
      );
    return intersolveVisaChildWallet;
  }

  /**
   * This function reissues a card for a given registration ID.
   * - The function first creates a new (child) token at Intersolve
   * - Creates a new child wallet entity,
   * - Substitutes the old token with the new one.
   * - Finally, it creates a new card and updates the child wallet status.
   *
   * @param {ReissueCardParams} input - The parameters for the card reissuance.
   * @throws {Error} Throws an Error if no customer, parent wallet, or child wallet is found for the given registration ID, or if the child wallet to be replaced does not have a card created for it.
   * @returns {Promise<void>}
   */
  public async reissueCard(input: ReissueCardParams): Promise<void> {
    // TODO: REFACTOR: See Dom's suggestion: https://gist.github.com/aberonni/afed0df72b77f0d1c71f454b7c1f7098 ####
    const intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneWithWalletsByRegistrationId(
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
    const childWalletToReplace =
      intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets[0];

    try {
      await this.executeReissueCardSteps(
        input,
        intersolveVisaCustomer,
        childWalletToReplace,
      );
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        throw new HttpException(
          `${IntersolveVisa121ErrorText.reissueCard} - ${error.message}`,
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw error;
      }
    }
  }

  public async executeReissueCardSteps(
    input: ReissueCardParams,
    intersolveVisaCustomer: IntersolveVisaCustomerEntity,
    childWalletToReplace: IntersolveVisaChildWalletEntity,
  ): Promise<void> {
    // Update Customer at Intersolve with the received address and phone number, to make sure that any old data at Intersolve is replaced.
    // TODO: Add a call to the new this.syncIntersolveCustomerWith121() function here. Creating this function is part of the re-implementation of sending data to Intersolve after Registration changes. ####

    if (childWalletToReplace.isTokenBlocked) {
      await this.intersolveVisaApiService.setTokenBlocked(
        childWalletToReplace.tokenCode,
        false,
      );
    }

    // Create new token at Intersolve
    const issueTokenResult = await this.intersolveVisaApiService.issueToken({
      brandCode: input.brandCode,
      activate: false, // Child Wallets are always created deactivated
      reference: process.env.MOCK_INTERSOLVE
        ? intersolveVisaCustomer.holderId
        : undefined,
    });

    // Substitute the old token with the new token at Intersolve
    await this.intersolveVisaApiService.substituteToken({
      oldTokenCode: childWalletToReplace.tokenCode,
      newTokenCode: issueTokenResult.code,
    });

    // Create child wallet entity
    // Do this after the token has been succesfully substituted, so to make this API call more idempotent
    const newIntersolveVisaChildWallet = new IntersolveVisaChildWalletEntity();
    newIntersolveVisaChildWallet.intersolveVisaParentWallet =
      intersolveVisaCustomer.intersolveVisaParentWallet;
    newIntersolveVisaChildWallet.tokenCode = issueTokenResult.code;
    newIntersolveVisaChildWallet.isTokenBlocked = issueTokenResult.blocked;
    newIntersolveVisaChildWallet.walletStatus =
      issueTokenResult.status as IntersolveVisaTokenStatus;
    newIntersolveVisaChildWallet.lastExternalUpdate = new Date();
    newIntersolveVisaChildWallet.isLinkedToParentWallet = true;
    const newChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(
        newIntersolveVisaChildWallet,
      );
    intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets.push(
      newChildWallet,
    );

    // Update old child wallet: set status to SUBSTITUTED
    childWalletToReplace.walletStatus = IntersolveVisaTokenStatus.Substituted;
    childWalletToReplace =
      await this.intersolveVisaChildWalletScopedRepository.save(
        childWalletToReplace,
      );

    // Create new card
    await this.intersolveVisaApiService.createPhysicalCard({
      tokenCode: newChildWallet.tokenCode,
      name: input.name,
      contactInformation: {
        addressStreet: input.contactInformation.addressStreet,
        addressHouseNumber: input.contactInformation.addressHouseNumber,
        addressHouseNumberAddition:
          input.contactInformation.addressHouseNumberAddition,
        addressPostalCode: input.contactInformation.addressPostalCode,
        addressCity: input.contactInformation.addressCity,
        phoneNumber: input.contactInformation.phoneNumber,
      },
      coverLetterCode: input.coverLetterCode,
    });

    // Update child wallet: set isDebitCardCreated to true
    newChildWallet.isDebitCardCreated = true;
    // TODO: Find out if it's safe to assume that cards that receive a 200 on createPhysicalCard are always cardOk
    newChildWallet.cardStatus = IntersolveVisaCardStatus.CardOk;
    await this.intersolveVisaChildWalletScopedRepository.save(newChildWallet);
  }

  public async hasIntersolveCustomer(registrationId: number): Promise<boolean> {
    const count = await this.intersolveVisaCustomerScopedRepository
      .createQueryBuilder('customer')
      .andWhere('customer.registrationId = :registrationId', { registrationId })
      .getCount();
    return count > 0;
  }

  /**
   * This function calculates the transfer amount after updating the wallet information for a given registration ID.
   * - It finds a customer for registrationId. If the customer has any child wallets, it retrieves and updates the latest information of the wallets and card from Intersolve.
   * - It then calculates the amount that should be transferred. If the registration does not have a customer yet, the spentThisMonth and balance will be 0.
   *
   * @param {number} registrationId - The registration ID for which to calculate the transfer amount.
   * @param {number} inputTransferAmount - The initial amount to be transferred.
   * @throws {Error} Throws an Error if no customer is found for the given registration ID.
   * @returns {Promise<number>} The calculated transfer amount. This is the inputTransferAmount amount capped by 150 - spendThisMonth - currentBalance.
   */
  public async calculateTransferAmountWithWalletUpdate(
    registrationId: number,
    inputTransferAmountInMajorUnit: number,
  ): Promise<number> {
    const intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneWithWalletsByRegistrationId(
        registrationId,
      );
    // If there are any child wallets no-matter the status, retrieve latest information of the wallets and card from intersolve before calculating transfer amount from them.
    if (
      intersolveVisaCustomer?.intersolveVisaParentWallet
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

    // Calculate the amount that should be transfered. If the registration does not have customer yet the spendThisMonth and balance will be 0.
    return this.calculateLimitedTransferAmount({
      transactionAmountInMajorUnit: inputTransferAmountInMajorUnit,
      spentThisMonth:
        intersolveVisaCustomer?.intersolveVisaParentWallet?.spentThisMonth ?? 0,
      balance: intersolveVisaCustomer?.intersolveVisaParentWallet?.balance ?? 0,
    });
  }

  // Calculated the amount that can be transferred based on the limits of maxumum amount on a wallet and maximum amount that can be spent per month.
  private calculateLimitedTransferAmount({
    transactionAmountInMajorUnit: transactionAmountMajorUnit,
    spentThisMonth,
    balance,
  }: {
    transactionAmountInMajorUnit: number;
    spentThisMonth: number;
    balance: number;
  }): number {
    const calculatedAmountMajorUnit =
      (maximumAmountOfSpentCentPerMonth - spentThisMonth - balance) / 100;

    if (calculatedAmountMajorUnit > 0) {
      return Math.min(calculatedAmountMajorUnit, transactionAmountMajorUnit);
    } else {
      return 0;
    }
  }

  /**
   * This function pauses or unpauses a card associated with a given token code by blocking or unblocking the token at the Intersolve API.
   * @param {string} tokenCode - The token code of the card to pause or unpause.
   * @param {boolean} pause - Whether to pause (true) or unpause (false) the card.
   * @throws {Error} Throws an Error if no wallet is found for the given token code, or if the wallet's token is already in the desired state.
   * @returns {Promise<IntersolveVisaChildWalletEntity>} The updated wallet.
   */
  public async pauseCardOrThrow(
    tokenCode: string,
    pause: boolean,
  ): Promise<IntersolveVisaChildWalletEntity> {
    const wallet =
      await this.intersolveVisaChildWalletScopedRepository.findOneOrFail({
        where: { tokenCode: Equal(tokenCode) },
      });
    if (wallet.isTokenBlocked === pause) {
      throw new HttpException(
        `Token is already ${pause ? 'blocked' : 'unblocked'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.intersolveVisaApiService.setTokenBlocked(tokenCode, pause);
    wallet.isTokenBlocked = pause;
    return await this.intersolveVisaChildWalletScopedRepository.save(wallet);
  }

  /**
   * Retrieves and updates all wallets and cards for all customers. Used by cronjob.
   */
  public async retrieveAndUpdateAllWalletsAndCards(): Promise<void> {
    const customers =
      await this.intersolveVisaCustomerScopedRepository.findWithWallets();
    for (const customer of customers) {
      for (const childWallet of customer.intersolveVisaParentWallet
        .intersolveVisaChildWallets) {
        if (
          childWallet.walletStatus !== IntersolveVisaTokenStatus.Substituted
        ) {
          await this.retrieveAndUpdateChildWallet(childWallet);
        }
      }
      await this.retrieveAndUpdateParentWallet(
        customer.intersolveVisaParentWallet,
      );
    }
  }

  // TODO: It looks like the old implementation (this.syncIntersolveCustomerWith121) had some logic to only send data to Intersolve if it changed. Do we want to implement that again? That probably then should be in the RegistrationService and not here.
  /**
   * This function sends updated contact information for a customer to Intersolve. It uses 2 api call:
   * - update the address
   * - update phone number
   * @param {SendUpdatedContactInformationParams} input - The updated contact information for the customer.
   * @throws {Error} Throws an Error if no customer is found for the given registration ID.
   * @returns {Promise<void>}
   */
  public async sendUpdatedContactInformation(
    input: SendUpdatedContactInformationParams,
  ): Promise<void> {
    const customer =
      await this.intersolveVisaCustomerScopedRepository.findOneByRegistrationIdOrFail(
        input.registrationId,
      );

    await this.intersolveVisaApiService.updateCustomerAddress({
      holderId: customer.holderId,
      addressStreet: input.contactInformation.addressStreet,
      addressHouseNumber: input.contactInformation.addressHouseNumber,
      addressHouseNumberAddition:
        input.contactInformation.addressHouseNumberAddition,
      addressPostalCode: input.contactInformation.addressPostalCode,
      addressCity: input.contactInformation.addressCity,
    });

    await this.intersolveVisaApiService.updateCustomerPhoneNumber({
      holderId: customer.holderId,
      phoneNumber: input.contactInformation.phoneNumber,
    });
  }
}
