import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { CreatePhysicalCardParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/create-physical-card-params.interface';
import { DoTransferOrIssueCardParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-params.interface';
import { DoTransferOrIssueCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/do-transfer-or-issue-card-return-type.interface';
import { GetPhysicalCardReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-physical-card-return-type.interface';
import { GetTokenReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-token-return-type.interface';
import { GetTransactionInformationReturnType } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-transaction-information-return-type.interface';
import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';
import { ReissueCardParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/reissue-card-params.interface';
import { SendUpdatedContactInformationParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/send-updated-contact-information-params.interface';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaDtoMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-dto.mapper';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';

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
  public async doTransferOrIssueCard({
    registrationId,
    createCustomerReference,
    name,
    contactInformation,
    brandCode,
    coverLetterCode,
    fundingTokenCode,
    transferAmountInMajorUnit,
    transferReference,
  }: DoTransferOrIssueCardParams): Promise<DoTransferOrIssueCardReturnType> {
    const intersolveVisaCustomer = await this.getCustomerOrCreate({
      registrationId,
      createCustomerReference,
      name,
      contactInformation,
    });

    const intersolveVisaParentWallet = await this.getParentWalletOrCreate({
      intersolveVisaCustomer,
      brandCode,
    });

    await this.linkParentWalletToCustomerIfUnlinked({
      intersolveVisaCustomer,
      intersolveVisaParentWallet,
    });

    const intersolveVisaChildWallets = await this.getChildWalletsOrCreateOne({
      intersolveVisaParentWallet,
      brandCode,
    });

    // Sort wallets by newest creation date first, so that we can hereafter assume the first element represents the current wallet
    intersolveVisaChildWallets.sort((a, b) => (a.created < b.created ? 1 : -1));
    const newestChildWallet = intersolveVisaChildWallets[0];

    await this.linkChildWalletToParentWalletIfUnlinked(
      intersolveVisaParentWallet,
      newestChildWallet,
    );

    // Check if debit card is created
    const createDebitCardReturn = await this.createDebitCardIfNotExists({
      childWallet: newestChildWallet,
      name,
      contactInformation,
      coverLetterCode,
    });

    // Transfer money from the client's funding token to the parent token
    if (transferAmountInMajorUnit > 0) {
      await this.intersolveVisaApiService.transfer({
        fromTokenCode: fundingTokenCode,
        toTokenCode: intersolveVisaParentWallet.tokenCode,
        amount: transferAmountInMajorUnit,
        reference: transferReference,
      });
    }
    return {
      isNewCardCreated: createDebitCardReturn.isNewCardCreated,
      amountTransferredInMajorUnit: transferAmountInMajorUnit,
    };
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

  private async getCustomerOrCreate({
    registrationId,
    createCustomerReference,
    name,
    contactInformation,
  }: {
    registrationId: number;
    createCustomerReference: string;
    name: string;
    contactInformation: ContactInformation;
  }): Promise<IntersolveVisaCustomerEntity> {
    let intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneWithWalletsByRegistrationId(
        registrationId,
      );
    if (intersolveVisaCustomer) {
      return intersolveVisaCustomer;
    }

    const createCustomerResult =
      await this.intersolveVisaApiService.createCustomer({
        externalReference: createCustomerReference,
        name,
        contactInformation: {
          addressStreet: contactInformation.addressStreet,
          addressHouseNumber: contactInformation.addressHouseNumber,
          addressHouseNumberAddition:
            contactInformation.addressHouseNumberAddition,
          addressPostalCode: contactInformation.addressPostalCode,
          addressCity: contactInformation.addressCity,
          phoneNumber: contactInformation.phoneNumber,
        },
        estimatedAnnualPaymentVolumeMajorUnit: 12 * 44 * 100,
      });

    // if success, store customer
    const newIntersolveVisaCustomer = new IntersolveVisaCustomerEntity();
    newIntersolveVisaCustomer.registrationId = registrationId;
    newIntersolveVisaCustomer.holderId = createCustomerResult.holderId;
    intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.save(
        newIntersolveVisaCustomer,
      );
    return intersolveVisaCustomer;
  }

  private async getParentWalletOrCreate({
    intersolveVisaCustomer,
    brandCode,
  }: {
    intersolveVisaCustomer: IntersolveVisaCustomerEntity;
    brandCode: string;
  }): Promise<IntersolveVisaParentWalletEntity> {
    // Check if a parent wallet exists and return it if it does
    if (intersolveVisaCustomer.intersolveVisaParentWallet) {
      return intersolveVisaCustomer.intersolveVisaParentWallet;
    }

    // If not, create parent wallet
    const issueTokenResult = await this.intersolveVisaApiService.issueToken({
      brandCode,
      activate: true, // Parent Wallets are always created activated
      reference: process.env.MOCK_INTERSOLVE
        ? intersolveVisaCustomer.holderId
        : undefined,
    });

    const newIntersolveVisaParentWallet =
      new IntersolveVisaParentWalletEntity();
    newIntersolveVisaParentWallet.intersolveVisaCustomer =
      intersolveVisaCustomer;
    newIntersolveVisaParentWallet.tokenCode = issueTokenResult.code;
    newIntersolveVisaParentWallet.lastExternalUpdate = new Date();

    const savedIntersolveVisaParentWallet =
      await this.intersolveVisaParentWalletScopedRepository.save(
        newIntersolveVisaParentWallet,
      );
    //  Since the parent wallet is created, we can assume that the child wallets are not created yet.
    savedIntersolveVisaParentWallet.intersolveVisaChildWallets = [];
    return savedIntersolveVisaParentWallet;
  }

  private async linkParentWalletToCustomerIfUnlinked({
    intersolveVisaCustomer,
    intersolveVisaParentWallet,
  }: {
    intersolveVisaCustomer: IntersolveVisaCustomerEntity;
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity;
  }): Promise<void> {
    // Check if parent wallet is linked to customer
    if (intersolveVisaParentWallet.isLinkedToVisaCustomer) {
      return;
    }
    // if not, link parent wallet to customer (registerHolder returns nothing if success and throw exception if failed)
    await this.intersolveVisaApiService.registerHolder({
      holderId: intersolveVisaCustomer.holderId,
      tokenCode: intersolveVisaParentWallet.tokenCode,
    });

    // Update parent wallet: set linkedToVisaCustomer to true
    intersolveVisaParentWallet.isLinkedToVisaCustomer = true;
    await this.intersolveVisaParentWalletScopedRepository.update(
      intersolveVisaParentWallet.id,
      { isLinkedToVisaCustomer: true },
    );
  }

  private async getChildWalletsOrCreateOne({
    intersolveVisaParentWallet,
    brandCode,
  }: {
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity;
    brandCode: string;
  }): Promise<IntersolveVisaChildWalletEntity[]> {
    // Check if at least one child wallet exists
    if (intersolveVisaParentWallet.intersolveVisaChildWallets.length) {
      return intersolveVisaParentWallet.intersolveVisaChildWallets;
    }

    // If not, create new child wallet
    const issueTokenResult = await this.intersolveVisaApiService.issueToken({
      brandCode,
      activate: false, // Child Wallets are always created deactivated
      reference: process.env.MOCK_INTERSOLVE
        ? intersolveVisaParentWallet.intersolveVisaCustomer.holderId
        : undefined,
    });

    // Store child wallet
    const newIntersolveVisaChildWallet = new IntersolveVisaChildWalletEntity();
    newIntersolveVisaChildWallet.intersolveVisaParentWallet =
      intersolveVisaParentWallet;
    newIntersolveVisaChildWallet.tokenCode = issueTokenResult.code;
    newIntersolveVisaChildWallet.isTokenBlocked = issueTokenResult.blocked;
    newIntersolveVisaChildWallet.walletStatus =
      issueTokenResult.status as IntersolveVisaTokenStatus;
    newIntersolveVisaChildWallet.lastExternalUpdate = new Date();
    const intersolveVisaChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(
        newIntersolveVisaChildWallet,
      );
    // Return the new child wallet as an array
    return [intersolveVisaChildWallet];
  }

  private async linkChildWalletToParentWalletIfUnlinked(
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity,
    intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<void> {
    // Check if child wallet is linked to parent wallet
    if (intersolveVisaChildWallet.isLinkedToParentWallet) {
      return;
    }
    // if not, link child wallet to parent wallet (linkToken returns nothing if success and throw exception if failed)
    await this.intersolveVisaApiService.linkToken({
      parentTokenCode: intersolveVisaParentWallet.tokenCode,
      childTokenCode: intersolveVisaChildWallet.tokenCode,
    });

    // Update child wallet: set linkedToParentWallet to true
    intersolveVisaChildWallet.isLinkedToParentWallet = true;
    await this.intersolveVisaChildWalletScopedRepository.update(
      intersolveVisaChildWallet.id,
      { isLinkedToParentWallet: true },
    );
  }

  private async createDebitCardIfNotExists({
    childWallet,
    name,
    contactInformation,
    coverLetterCode,
  }: {
    childWallet: IntersolveVisaChildWalletEntity;
    name: string;
    contactInformation: ContactInformation;
    coverLetterCode: string;
  }): Promise<{ isNewCardCreated: boolean }> {
    // Check if debit card is created
    if (childWallet.isDebitCardCreated) {
      return {
        isNewCardCreated: false,
      };
    }

    // If not, create debit card
    const createPhysicalCardDto: CreatePhysicalCardParams = {
      tokenCode: childWallet.tokenCode,
      name,
      contactInformation: {
        addressStreet: contactInformation.addressStreet,
        addressHouseNumber: contactInformation.addressHouseNumber,
        addressHouseNumberAddition:
          contactInformation.addressHouseNumberAddition,
        addressPostalCode: contactInformation.addressPostalCode,
        addressCity: contactInformation.addressCity,
        phoneNumber: contactInformation.phoneNumber,
      },
      coverLetterCode,
    };

    await this.intersolveVisaApiService.createPhysicalCard(
      createPhysicalCardDto,
    );

    // If success, update child wallet: set isDebitCardCreated to true
    childWallet.isDebitCardCreated = true;
    childWallet.cardStatus = IntersolveVisaCardStatus.CardOk;
    await this.intersolveVisaChildWalletScopedRepository.update(
      childWallet.id,
      {
        isDebitCardCreated: true,
        cardStatus: IntersolveVisaCardStatus.CardOk,
      },
    );

    return {
      isNewCardCreated: true,
    };
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

    // Our mock service always return that a token is not blocked
    // However when we are using the mock service, we should not update the token status else it is always false when you refresh the registration page
    if (!process.env.MOCK_INTERSOLVE) {
      intersolveVisaChildWallet.isTokenBlocked = getTokenResult.blocked;
    }
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

    // Update Customer at Intersolve with the received address and phone number, to make sure that any old data at Intersolve is replaced.
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
    newChildWallet.cardStatus = IntersolveVisaCardStatus.CardOk;
    await this.intersolveVisaChildWalletScopedRepository.save(newChildWallet);
  }

  public async hasIntersolveCustomer(registrationId: number): Promise<boolean> {
    await this.intersolveVisaCustomerScopedRepository.findOneByOrFail({
      registrationId,
    });

    return true;
  }

  /**
   * This function calculates the transfer amount after retrieving the wallet information for a given registration ID.
   * - It finds a customer for registrationId. If the customer has any child wallets, it retrieves and updates the latest information of the wallets and card from Intersolve.
   * - It then calculates the amount that should be transferred. If the registration does not have a customer yet, the spentThisMonth and balance will be 0.
   *
   * @param {number} registrationId - The registration ID for which to calculate the transfer amount.
   * @param {number} inputTransferAmount - The initial amount to be transferred.
   * @throws {Error} Throws an Error if no customer is found for the given registration ID.
   * @returns {Promise<number>} The calculated transfer amount. This is the inputTransferAmount amount capped by 150 - spendThisMonth - currentBalance.
   */
  public async calculateTransferAmountWithWalletRetrieval({
    registrationId,
    inputTransferAmountInMajorUnit,
  }: {
    registrationId: number;
    inputTransferAmountInMajorUnit: number;
  }): Promise<number> {
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
    transactionAmountInMajorUnit,
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
      return Math.min(calculatedAmountMajorUnit, transactionAmountInMajorUnit);
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

  /**
   * This function sends updated contact information for a customer to Intersolve. It uses 2 api call:
   * - update the address
   * - update phone number
   * @param {SendUpdatedContactInformationParams} input - The updated contact information for the customer.
   * @throws {Error} Throws an Error if no customer is found for the given registration ID.
   * @returns {Promise<void>}
   */
  public async sendUpdatedContactInformation({
    registrationId,
    contactInformation,
  }: SendUpdatedContactInformationParams): Promise<void> {
    const customer =
      await this.intersolveVisaCustomerScopedRepository.findOneByRegistrationIdOrFail(
        registrationId,
      );

    await this.intersolveVisaApiService.updateCustomerAddress({
      holderId: customer.holderId,
      addressStreet: contactInformation.addressStreet,
      addressHouseNumber: contactInformation.addressHouseNumber,
      addressHouseNumberAddition: contactInformation.addressHouseNumberAddition,
      addressPostalCode: contactInformation.addressPostalCode,
      addressCity: contactInformation.addressCity,
    });

    await this.intersolveVisaApiService.updateCustomerPhoneNumber({
      holderId: customer.holderId,
      phoneNumber: contactInformation.phoneNumber,
    });
  }

  public async getWallet(tokenCode: string) {
    return await this.intersolveVisaApiService.getToken(tokenCode);
  }
}
