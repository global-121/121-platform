import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-wallet.dto';
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
import { ReissueCardParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/reissue-card-params.interface';
import { SendUpdatedContactInformationParams } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/send-updated-contact-information-params.interface';
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

  // TODO: REFACTOR: See Dom's suggestion: https://gist.github.com/aberonni/afed0df72b77f0d1c71f454b7c1f7098
  public async doTransferOrIssueCard(
    input: DoTransferOrIssueCardParams,
  ): Promise<DoTransferOrIssueCardReturnType> {
    // TODO: Is this the desired way of initializing the return data?
    const returnData: DoTransferOrIssueCardReturnType = {
      cardCreated: false,
      transferDone: false,
      amountTransferred: 0,
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
            // TODO: Check if this is the correct way to handle optional fields
            addressHouseNumberAddition:
              input.contactInformation.addressHouseNumberAddition!,
            addressPostalCode: input.contactInformation.addressPostalCode,
            addressCity: input.contactInformation.addressCity,
            phoneNumber: input.contactInformation.phoneNumber,
          },
          estimatedAnnualPaymentVolumeMajorUnit: 12 * 44, // This is assuming 44 euro per month for a year for 1 child
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

      // TODO: Add object into functions that have a DTO as parameter, instead of first creating the object and then passing it into the function. => everywhere

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
      // TODO: Check if this is the correct way to check if a child wallet does not exist
      // If not, create child wallet

      const issueTokenResult = await this.intersolveVisaApiService.issueToken({
        brandCode: input.brandCode,
        activate: false, // Child Wallets are always created deactivated
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
      // TODO: Find out if it's safe to assume that cards that receive a 200 on createPhysicalCard are always CardOk
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
    if (input.transferAmount > 0) {
      await this.intersolveVisaApiService.transfer({
        fromTokenCode: input.fundingTokenCode,
        toTokenCode:
          intersolveVisaCustomer.intersolveVisaParentWallet.tokenCode,
        amount: input.transferAmount,
        reference: input.transferReference,
      });
      returnData.transferDone = true;
      returnData.amountTransferred = input.transferAmount;
    }

    return returnData;
  }

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
    // TODO: Implement this method.

    // Get child wallet information
    const getTokenResult: GetTokenReturnType =
      await this.intersolveVisaApiService.getToken(
        intersolveVisaChildWallet.tokenCode,
      );

    // Get card status
    const GetPhysicalCardReturnDto: GetPhysicalCardReturnType =
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

  public async reissueCard(input: ReissueCardParams): Promise<void> {
    // TODO: REFACTOR: See Dom's suggestion: https://gist.github.com/aberonni/afed0df72b77f0d1c71f454b7c1f7098
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
      await this.intersolveVisaApiService.setTokenBlocked(
        childWalletToReplace.tokenCode,
        false,
      );
    }

    // Create new token at Intersolve
    const issueTokenResult = await this.intersolveVisaApiService.issueToken({
      brandCode: input.brandCode,
      activate: false, // Child Wallets are always created deactivated
    });

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
    await this.intersolveVisaApiService.substituteToken({
      oldTokenCode: childWalletToReplace.tokenCode,
      newTokenCode: newChildWallet.tokenCode,
    });

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
    newChildWallet =
      await this.intersolveVisaChildWalletScopedRepository.save(newChildWallet);
  }

  public async hasIntersolveCustomer(registrationId: number): Promise<boolean> {
    const count = await this.intersolveVisaCustomerScopedRepository
      .createQueryBuilder('customer')
      .andWhere('customer.registrationId = :registrationId', { registrationId })
      .getCount();
    return count > 0;
  }

  public async calculateTransferAmountWithWalletUpdate(
    registrationId: number,
    inputTransferAmount: number,
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
      transactionAmount: inputTransferAmount,
      spentThisMonth:
        intersolveVisaCustomer?.intersolveVisaParentWallet?.spentThisMonth ?? 0,
      balance: intersolveVisaCustomer?.intersolveVisaParentWallet?.balance ?? 0,
    });
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
  public async sendUpdatedContactInformation(
    input: SendUpdatedContactInformationParams,
  ): Promise<void> {
    const customer =
      await this.intersolveVisaCustomerScopedRepository.findOneByRegistrationIdOrFail(
        input.registrationId,
      );

    // TODO: Is there a shorter / more expressive way of putting these variables into the method?
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
