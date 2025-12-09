import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

import { env } from '@121-service/src/env';
import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { CreatePhysicalCardParams } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/create-physical-card-params.interface';
import { DoTransferOrIssueCardParams } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/do-transfer-or-issue-card-params.interface';
import { DoTransferOrIssueCardResult } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/do-transfer-or-issue-card-result.interface';
import { GetPhysicalCardResult } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/get-physical-card-result.interface';
import { GetTokenResult } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/get-token-result.interface';
import { GetTransactionInformationResult } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/get-transaction-information-result.interface';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { ReissueCardParams } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/reissue-card-params.interface';
import { SendUpdatedContactInformationParams } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/send-updated-contact-information-params.interface';
import { maximumAmountOfSpentCentPerMonth } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa.const';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaDtoMapper } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/mappers/intersolve-visa-dto.mapper';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';
import { IntersolveVisaApiService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.api.service';

@Injectable()
export class IntersolveVisaService {
  public constructor(
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
    private readonly intersolveVisaCustomerScopedRepository: IntersolveVisaCustomerScopedRepository,
    private readonly intersolveVisaParentWalletScopedRepository: IntersolveVisaParentWalletScopedRepository,
    private readonly intersolveVisaChildWalletScopedRepository: IntersolveVisaChildWalletScopedRepository,
  ) {}

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
   * @returns {Promise<DoTransferOrIssueCardResult>} The result of the operation, including whether a card was created, whether a transfer was done, and the amount transferred in major units.
   */
  public async doTransferOrIssueCard({
    registrationId,
    createCustomerReference,
    contactInformation,
    brandCode,
    coverLetterCode,
    fundingTokenCode,
    transferValueInMajorUnit,
    transferReference,
  }: DoTransferOrIssueCardParams): Promise<DoTransferOrIssueCardResult> {
    const intersolveVisaCustomer = await this.getCustomerOrCreate({
      registrationId,
      createCustomerReference,
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
      contactInformation,
      coverLetterCode,
    });

    // Transfer money from the client's funding token to the parent token
    if (transferValueInMajorUnit > 0) {
      await this.intersolveVisaApiService.transfer({
        fromTokenCode: fundingTokenCode,
        toTokenCode: intersolveVisaParentWallet.tokenCode,
        amount: transferValueInMajorUnit,
        reference: transferReference,
      });
    }
    return {
      isNewCardCreated: createDebitCardReturn.isNewCardCreated,
      amountTransferredInMajorUnit: transferValueInMajorUnit,
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

    // Retrieve and update the current wallet from Intersolve (= skip all substituted wallets)
    for (const childWallet of customer.intersolveVisaParentWallet
      .intersolveVisaChildWallets) {
      if (childWallet.walletStatus !== IntersolveVisaTokenStatus.Substituted) {
        await this.updateChildWallet(childWallet);
      }
    }

    // Retrieve and update the parent wallet from Intersolve
    const intersolveVisaParentWallet = await this.retrieveAndUpdateParentWallet(
      customer.intersolveVisaParentWallet,
    );

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

  public async getCustomerOrCreate({
    registrationId,
    createCustomerReference,
    contactInformation,
  }: {
    registrationId: number;
    createCustomerReference: string;
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
        contactInformation,
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

  public async getParentWalletOrCreate({
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
      reference: env.MOCK_INTERSOLVE
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

  public async linkParentWalletToCustomerIfUnlinked({
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
    await this.intersolveVisaParentWalletScopedRepository.updateUnscoped(
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
      reference: env.MOCK_INTERSOLVE
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

  public async linkChildWalletToParentWalletIfUnlinked(
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity,
    intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<void> {
    // Check if child wallet is linked to parent wallet
    if (intersolveVisaChildWallet.isLinkedToParentWallet) {
      return;
    }
    // if not, link child wallet to parent wallet (linkWallet returns nothing if success and throw exception if failed)
    await this.linkWallets({
      parentTokenCode: intersolveVisaParentWallet.tokenCode,
      childTokenCode: intersolveVisaChildWallet.tokenCode,
    });

    // Update child wallet: set linkedToParentWallet to true
    intersolveVisaChildWallet.isLinkedToParentWallet = true;
    await this.intersolveVisaChildWalletScopedRepository.updateUnscoped(
      intersolveVisaChildWallet.id,
      { isLinkedToParentWallet: true },
    );
  }

  private async createDebitCardIfNotExists({
    childWallet,
    contactInformation,
    coverLetterCode,
  }: {
    childWallet: IntersolveVisaChildWalletEntity;
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
      contactInformation,
      coverLetterCode,
    };

    await this.intersolveVisaApiService.createPhysicalCard(
      createPhysicalCardDto,
    );

    // If success, update child wallet: set isDebitCardCreated to true
    childWallet.isDebitCardCreated = true;
    childWallet.cardStatus = IntersolveVisaCardStatus.CardOk;
    await this.intersolveVisaChildWalletScopedRepository.updateUnscoped(
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
    await this.updateParentWallet(intersolveVisaParentWallet);
    const updatedParentWallet =
      await this.intersolveVisaParentWalletScopedRepository.findOneOrFail({
        where: { id: Equal(intersolveVisaParentWallet.id) },
        relations: ['intersolveVisaChildWallets'],
      });
    return updatedParentWallet;
  }

  private async updateParentWallet(
    intersolveVisaParentWallet: IntersolveVisaParentWalletEntity,
  ): Promise<void> {
    // Get balance on the parent wallet
    const getTokenResult: GetTokenResult =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaParentWallet.tokenCode,
      );

    // Get parent wallet transaction info from Intersolve
    const getTransactionInformationResultDto: GetTransactionInformationResult =
      await this.intersolveVisaApiService.getTransactionInformation(
        intersolveVisaParentWallet.tokenCode,
      );

    // If there is no new last transaction date, we do not update the lastUsedDate
    // Because we only get transactions information from a certain time period in the past and we do not want to overwrite the lastUsedDate null
    const updatePayload: Partial<IntersolveVisaParentWalletEntity> = {
      balance: getTokenResult.balance,
      spentThisMonth: getTransactionInformationResultDto.spentThisMonth,
      lastExternalUpdate: new Date(),
    };
    if (getTransactionInformationResultDto.lastTransactionDate !== null) {
      updatePayload.lastUsedDate =
        getTransactionInformationResultDto.lastTransactionDate;
    }
    await this.intersolveVisaParentWalletScopedRepository.updateUnscoped(
      intersolveVisaParentWallet.id,
      updatePayload as QueryDeepPartialEntity<IntersolveVisaParentWalletEntity>,
    );
  }

  private async retrieveAndUpdateChildWallet(
    intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<IntersolveVisaChildWalletEntity> {
    await this.updateChildWallet(intersolveVisaChildWallet);
    const updatedChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.findOneOrFail({
        where: { id: Equal(intersolveVisaChildWallet.id) },
      });
    return updatedChildWallet;
  }

  private async updateChildWallet(
    intersolveVisaChildWallet: IntersolveVisaChildWalletEntity,
  ): Promise<void> {
    // Get child wallet information
    const getTokenResult: GetTokenResult =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaChildWallet.tokenCode,
      );

    const updatePayload: Partial<IntersolveVisaChildWalletEntity> = {
      walletStatus: getTokenResult.status,
      lastExternalUpdate: new Date(),
    };
    // Get card status
    if (intersolveVisaChildWallet.isDebitCardCreated) {
      const GetPhysicalCardReturnDto: GetPhysicalCardResult =
        await this.intersolveVisaApiService.getPhysicalCard(
          intersolveVisaChildWallet.tokenCode,
        );
      updatePayload.cardStatus = GetPhysicalCardReturnDto.status;
    }

    // Our mock service always return that a token is not blocked
    // However when we are using the mock service, we should not update the token status else it is always false when you refresh the registration page
    if (!env.MOCK_INTERSOLVE) {
      updatePayload.isTokenBlocked = getTokenResult.blocked;
    }

    await this.intersolveVisaChildWalletScopedRepository.updateUnscoped(
      intersolveVisaChildWallet.id,
      updatePayload as QueryDeepPartialEntity<IntersolveVisaChildWalletEntity>,
    );
  }

  /**
   * This function reissues a card for a given registration ID.
   * - The function first creates a new (child) token at Intersolve
   * - Creates a new child wallet entity,
   * - Substitutes the old token with the new one.
   * - Finally, it creates a new card and updates the child wallet status.
   *
   * @param {ReissueCardParams} input - The parameters for the card re-issuance.
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

    let issueTokenResult;
    if (input.physicalCardToken) {
      issueTokenResult = await this.intersolveVisaApiService.getToken(
        input.physicalCardToken,
      );
    } else {
      // Create new token at Intersolve
      issueTokenResult = await this.intersolveVisaApiService.issueToken({
        brandCode: input.brandCode,
        activate: false, // Child Wallets are always created deactivated
        reference: env.MOCK_INTERSOLVE
          ? intersolveVisaCustomer.holderId
          : undefined,
      });
    }

    // Substitute the old token with the new token at Intersolve
    await this.intersolveVisaApiService.substituteToken({
      oldTokenCode: childWalletToReplace.tokenCode,
      newTokenCode: issueTokenResult.code,
    });

    // Create child wallet entity
    // Do this after the token has been successfully substituted, so to make this API call more idempotent
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
      contactInformation: input.contactInformation,
      coverLetterCode: input.coverLetterCode,
    });

    // Update child wallet: set isDebitCardCreated to true
    newChildWallet.isDebitCardCreated = true;
    newChildWallet.cardStatus = IntersolveVisaCardStatus.CardOk;
    await this.intersolveVisaChildWalletScopedRepository.save(newChildWallet);
  }

  public async hasIntersolveCustomer(registrationId: number): Promise<boolean> {
    const count = await this.intersolveVisaCustomerScopedRepository.count({
      where: {
        registrationId: Equal(registrationId),
      },
    });
    return count > 0;
  }

  /**
   * This function calculates the transfer value after retrieving the wallet information for a given registration ID.
   * - It finds a customer for registrationId. If the customer has any child wallets, it retrieves and updates the latest information of the wallets and card from Intersolve.
   * - It then calculates the amount that should be transferred. If the registration does not have a customer yet, the spentThisMonth and balance will be 0.
   *
   * @param {number} registrationId - The registration ID for which to calculate the transfer value.
   * @param {number} inputTransferValue - The initial amount to be transferred.
   * @throws {Error} Throws an Error if no customer is found for the given registration ID.
   * @returns {Promise<number>} The calculated transfer value. This is the inputTransferValue amount capped by 150 - spendThisMonth - currentBalance.
   */
  public async calculateTransferValueWithWalletRetrieval({
    registrationId,
    inputTransferValueInMajorUnit,
  }: {
    registrationId: number;
    inputTransferValueInMajorUnit: number;
  }): Promise<number> {
    const intersolveVisaCustomer =
      await this.intersolveVisaCustomerScopedRepository.findOneWithWalletsByRegistrationId(
        registrationId,
      );
    // If there are any child wallets no-matter the status, retrieve latest information of the wallets and card from intersolve before calculating transfer value from them
    if (
      intersolveVisaCustomer?.intersolveVisaParentWallet
        ?.intersolveVisaChildWallets &&
      intersolveVisaCustomer.intersolveVisaParentWallet
        .intersolveVisaChildWallets.length > 0
    ) {
      intersolveVisaCustomer.intersolveVisaParentWallet.intersolveVisaChildWallets[0] =
        await this.retrieveAndUpdateChildWallet(
          intersolveVisaCustomer.intersolveVisaParentWallet
            .intersolveVisaChildWallets[0],
        );
      intersolveVisaCustomer.intersolveVisaParentWallet =
        await this.retrieveAndUpdateParentWallet(
          intersolveVisaCustomer.intersolveVisaParentWallet,
        );
    }

    // Calculate the amount that should be transferred. If the registration does not have customer yet the spendThisMonth and balance will be 0.
    return this.calculateLimitedTransferValue({
      transferValueInMajorUnit: inputTransferValueInMajorUnit,
      spentThisMonth:
        intersolveVisaCustomer?.intersolveVisaParentWallet?.spentThisMonth ?? 0,
      balance: intersolveVisaCustomer?.intersolveVisaParentWallet?.balance ?? 0,
    });
  }

  // Calculated the amount that can be transferred based on the limits of maximum amount on a wallet and maximum amount that can be spent per month.
  private calculateLimitedTransferValue({
    transferValueInMajorUnit,
    spentThisMonth,
    balance,
  }: {
    transferValueInMajorUnit: number;
    spentThisMonth: number;
    balance: number;
  }): number {
    const calculatedTransferValueMajorUnit =
      (maximumAmountOfSpentCentPerMonth - spentThisMonth - balance) / 100;

    if (calculatedTransferValueMajorUnit > 0) {
      return Math.min(
        calculatedTransferValueMajorUnit,
        transferValueInMajorUnit,
      );
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
  public async retrieveAndUpdateAllWalletsAndCards(): Promise<number> {
    const customers =
      await this.intersolveVisaCustomerScopedRepository.findWithWallets();
    const errorParentTokenCodes: string[] = [];
    for (const customer of customers) {
      if (!customer.intersolveVisaParentWallet) {
        continue;
      }
      try {
        for (const childWallet of customer.intersolveVisaParentWallet
          .intersolveVisaChildWallets) {
          if (
            childWallet.walletStatus !== IntersolveVisaTokenStatus.Substituted
          ) {
            await this.updateChildWallet(childWallet);
          }
        }
        await this.updateParentWallet(customer.intersolveVisaParentWallet);
      } catch (error) {
        if (error instanceof IntersolveVisaApiError) {
          errorParentTokenCodes.push(
            customer.intersolveVisaParentWallet.tokenCode,
          );
          console.error(
            'IntersolveVisaApiError occurred while retrieving and updating wallets for customer:',
            customer.registrationId,
            error.message,
          );

          if (errorParentTokenCodes.length >= 10) {
            throw new Error(
              `${errorParentTokenCodes.length} IntersolveVisaApiErrors occurred while retrieving and updating wallets and cards, for parent tokenCodes: ${errorParentTokenCodes.join(
                ', ',
              )}. Aborting.`,
            );
          }
        } else {
          // If the error is not an IntersolveVisaApiError, we rethrow it
          throw error;
        }
      }
    }

    // Return the number of customers processed which should equal the number of parent wallets updated
    return customers.length;
  }

  /**
   * This function sends updated contact information for a customer to Intersolve. It uses 2 api call:
   * - update the address
   * - update phone number
   * @param {SendUpdatedContactInformationParams} input - The updated contact information for the customer.
   * @throws {Error} Throws an Error if no customer is found for the given registration ID.
   * @returns {Promise<void>}
   */
  public async sendUpdatedCustomerInformation({
    registrationId,
    contactInformation,
  }: SendUpdatedContactInformationParams): Promise<void> {
    const customer =
      await this.intersolveVisaCustomerScopedRepository.findOneByRegistrationIdOrFail(
        registrationId,
      );
    if (contactInformation.phoneNumber) {
      await this.intersolveVisaApiService.updateCustomerPhoneNumber({
        holderId: customer.holderId,
        phoneNumber: contactInformation.phoneNumber,
      });
    }

    if (contactInformation.name) {
      await this.intersolveVisaApiService.updateCustomerIndividualName({
        holderId: customer.holderId,
        name: contactInformation.name,
      });
    }

    if (
      Object.entries(contactInformation).some(
        ([key, value]) =>
          value === undefined && key !== 'addressHouseNumberAddition',
      )
    ) {
      return;
    }
    await this.intersolveVisaApiService.updateCustomerAddress({
      holderId: customer.holderId,
      addressStreet: contactInformation.addressStreet,
      addressHouseNumber: contactInformation.addressHouseNumber,
      addressHouseNumberAddition: contactInformation.addressHouseNumberAddition,
      addressPostalCode: contactInformation.addressPostalCode,
      addressCity: contactInformation.addressCity,
    });
  }

  public async getWallet(tokenCode: string): Promise<GetTokenResult> {
    return await this.intersolveVisaApiService.getToken(tokenCode);
  }

  public async linkPhysicalCardToCustomer({
    intersolveVisaCustomer,
    tokenCode,
    brandCode,
  }: {
    intersolveVisaCustomer: IntersolveVisaCustomerEntity;
    tokenCode: string;
    brandCode: string;
  }) {
    const intersolveVisaParentWallet = await this.getParentWalletOrCreate({
      intersolveVisaCustomer,
      brandCode,
    });

    await this.linkParentWalletToCustomerIfUnlinked({
      intersolveVisaCustomer,
      intersolveVisaParentWallet,
    });

    await this.linkWallets({
      parentTokenCode: intersolveVisaParentWallet.tokenCode,
      childTokenCode: tokenCode,
    });
  }

  public async linkWallets({
    parentTokenCode,
    childTokenCode,
  }: {
    parentTokenCode: string;
    childTokenCode: string;
  }) {
    return await this.intersolveVisaApiService.linkToken({
      parentTokenCode,
      childTokenCode,
    });
  }
}
