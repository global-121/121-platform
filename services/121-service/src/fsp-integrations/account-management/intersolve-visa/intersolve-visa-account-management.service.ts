import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { env } from '@121-service/src/env';
import { VisaCardOrderResponseDto } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/dto/visa-card-order-response.dto';
import { VisaCardOrderMapper } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/mappers/visa-card-order.mapper';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa/intersolve-visa-data-synchronization.service';
import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisa121ErrorText } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { ExportVisaWalletClosure } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/export-visa-wallet-closure.interface';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaCardOrderRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-card-order.repository';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaWalletClosureScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-wallet-closure.scoped.repository';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class IntersolveVisaAccountManagementService {
  public constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly registrationsService: RegistrationsService,
    private readonly intersolveVisaDataSynchronizationService: IntersolveVisaDataSynchronizationService,
    private readonly intersolveVisaChildWalletScopedRepository: IntersolveVisaChildWalletScopedRepository,
    private readonly walletClosureScopedRepository: IntersolveVisaWalletClosureScopedRepository,
    private readonly cardOrderRepository: IntersolveVisaCardOrderRepository,
    private readonly cardOrderProcessorService: IntersolveVisaCardOrderProcessorService,
    private readonly azureLogService: AzureLogService,
  ) {}

  public async retrieveAndUpdateIntersolveVisaWalletAndCards(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        relations: [],
        programId,
      },
    );
    const maxBalanceInCents =
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId: registration.programFspConfigurationId,
        name: FspConfigurationProperties.maxBalanceInCents,
      });

    return await this.intersolveVisaService.retrieveAndUpdateWallet({
      registrationId: registration.id,
      maxBalanceInCents,
    });
  }

  public async getIntersolveVisaWalletAndCards(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        relations: [],
        programId,
      },
    );
    const maxBalanceInCents =
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId: registration.programFspConfigurationId,
        name: FspConfigurationProperties.maxBalanceInCents,
      });

    return await this.intersolveVisaService.getWalletWithCards({
      registrationId: registration.id,
      maxBalanceInCents,
    });
  }

  public async replaceCardByMail({
    referenceId,
    programId,
    userId,
  }: {
    referenceId: string;
    programId: number;
    userId: number;
  }) {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        programId,
      },
    );

    const cardDistributionByMailEnabled =
      await this.cardDistributionByMailEnabled(
        registration.programFspConfigurationId,
      );
    if (!cardDistributionByMailEnabled) {
      throw new HttpException(
        'Replacing a card by mail is not allowed when card distribution by mail is disabled.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isChildWalletLinkedToRegistration =
      await this.intersolveVisaChildWalletScopedRepository.hasLinkedChildWalletForRegistrationId(
        registration.id,
      );
    if (!isChildWalletLinkedToRegistration) {
      throw new HttpException(
        'Cannot replace a card for a registration which has no cards linked.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.replaceCard({
      referenceId,
      programId,
      registrationId: registration.id,
      programFspConfigurationId: registration.programFspConfigurationId,
    });

    await this.registrationsService.createMessageJobForRegistration({
      referenceId,
      programId,
      messageTemplateKey: ProgramNotificationEnum.replaceVisaCard,
      messageContentType: MessageContentType.custom,
      extendedMessageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      userId,
    });
  }

  public async replaceCardOnSite({
    referenceId,
    programId,
    tokenCode,
  }: {
    referenceId: string;
    programId: number;
    tokenCode: string;
  }): Promise<void> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        programId,
      },
    );

    const cardDistributionByMailEnabled =
      await this.cardDistributionByMailEnabled(
        registration.programFspConfigurationId,
      );
    if (cardDistributionByMailEnabled) {
      throw new HttpException(
        'Replacing a card on-site is not allowed when card distribution by mail is enabled.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.throwIfCardDoesNotExistOrIsAlreadyLinked(tokenCode);

    const isChildWalletLinkedToRegistration =
      await this.intersolveVisaChildWalletScopedRepository.hasLinkedChildWalletForRegistrationId(
        registration.id,
      );
    if (!isChildWalletLinkedToRegistration) {
      throw new HttpException(
        'Cannot replace a card for a registration which has no cards linked.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.replaceCard({
      referenceId,
      registrationId: registration.id,
      programFspConfigurationId: registration.programFspConfigurationId,
      programId,
      tokenCode,
    });
  }

  public async replaceCard({
    referenceId,
    programId,
    tokenCode,
    registrationId,
    programFspConfigurationId,
  }: {
    referenceId: string;
    programId: number;
    tokenCode?: string;
    registrationId: number;
    programFspConfigurationId: number;
  }): Promise<void> {
    const contactInformation: ContactInformation =
      await this.registrationsService.getContactInformation({
        referenceId,
        programId,
      });

    await this.intersolveVisaDataSynchronizationService.syncData({
      registrationId,
      contactInformation,
    });

    const brandCode =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId,
          name: FspConfigurationProperties.brandCode,
        },
      );
    const coverLetterCode =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId,
          name: FspConfigurationProperties.coverLetterCode,
        },
      );

    try {
      await this.intersolveVisaService.replaceCard({
        registrationId,
        contactInformation,
        brandCode,
        coverLetterCode,
        physicalCardToken: tokenCode,
      });
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        throw new HttpException(
          `${IntersolveVisa121ErrorText.replaceCard} - ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw error;
      }
    }
  }

  public async linkCardOnSiteToRegistration({
    referenceId,
    programId,
    tokenCode,
  }: {
    referenceId: string;
    programId: number;
    tokenCode: string;
  }): Promise<void> {
    await this.throwIfCardDoesNotExistOrIsAlreadyLinked(tokenCode);

    const registration: RegistrationEntity =
      await this.registrationsService.getRegistrationOrThrow({
        referenceId,
        programId,
      });

    const cardDistributionByMailEnabled =
      await this.cardDistributionByMailEnabled(
        registration.programFspConfigurationId,
      );
    if (cardDistributionByMailEnabled) {
      throw new HttpException(
        'Linking a card on-site is not allowed when card distribution by mail is enabled.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const contactInformation =
      await this.registrationsService.getContactInformation({
        referenceId,
        programId,
      });

    const brandCode =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId: registration.programFspConfigurationId,
          name: FspConfigurationProperties.brandCode,
        },
      );

    await this.intersolveVisaService.linkPhysicalCardToRegistration({
      contactInformation,
      referenceId,
      registrationId: registration.id,
      tokenCode,
      brandCode,
    });
  }

  private async cardDistributionByMailEnabled(
    programFspConfigurationId: number,
  ): Promise<boolean> {
    const cardDistributionByMail =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId,
          name: FspConfigurationProperties.cardDistributionByMail,
        },
      );

    return cardDistributionByMail;
  }

  public async pauseCardAndSendMessage(
    referenceId: string,
    programId: number,
    tokenCode: string,
    pause: boolean,
    userId: number,
  ): Promise<IntersolveVisaChildWalletEntity> {
    const updatedWallet = await this.intersolveVisaService.pauseCardOrThrow(
      tokenCode,
      pause,
    );
    await this.registrationsService.createMessageJobForRegistration({
      referenceId,
      programId,
      messageTemplateKey: pause
        ? ProgramNotificationEnum.pauseVisaCard
        : ProgramNotificationEnum.unpauseVisaCard,
      messageContentType: MessageContentType.custom,
      extendedMessageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      userId,
    });
    return updatedWallet;
  }

  public async closeCard({
    referenceId,
    programId,
    tokenCode,
  }: {
    referenceId: string;
    programId: number;
    tokenCode: string;
  }): Promise<void> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        programId,
      },
    );

    const wallet = await this.intersolveVisaChildWalletScopedRepository.findOne(
      {
        where: {
          tokenCode: Equal(tokenCode),
          intersolveVisaParentWallet: {
            intersolveVisaCustomer: {
              registrationId: Equal(registration.id),
            },
          },
        },
        relations: ['intersolveVisaParentWallet'],
      },
    );
    if (!wallet) {
      throw new HttpException(
        `Wallet with token code ${tokenCode} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (wallet.cardStatus === IntersolveVisaCardStatus.CardClosed) {
      throw new HttpException('Card is already closed', HttpStatus.BAD_REQUEST);
    }

    const fundingTokenCode =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId: registration.programFspConfigurationId,
          name: FspConfigurationProperties.fundingTokenCode,
        },
      );
    try {
      await this.intersolveVisaService.closeCardOrThrow({
        childWalletId: wallet.id,
        childTokenCode: wallet.tokenCode,
        isChildTokenBlocked: wallet.isTokenBlocked,
        parentTokenCode: wallet.intersolveVisaParentWallet.tokenCode,
        fundingTokenCode,
      });
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        throw new HttpException(
          error.message,

          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  public async getRegistrationAndSendContactInformationToIntersolve(
    referenceId: string,
    programId: number,
  ): Promise<void> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        programId,
      },
    );

    const contactInformation: ContactInformation =
      await this.registrationsService.getContactInformation({
        referenceId,
        programId,
      });

    await this.intersolveVisaDataSynchronizationService.syncData({
      registrationId: registration.id,
      contactInformation,
    });
  }

  private async throwIfCardDoesNotExistOrIsAlreadyLinked(
    tokenCode: string,
  ): Promise<void> {
    // TODO:
    // Throws if tokenCode (card) does not exist
    // We opened a ticket at Intersoleve to improve their error codes/messages
    // For now the response code is unreliable; it sometimes returns 404, sometimes 500
    let intersolveVisaChildWallet;
    try {
      intersolveVisaChildWallet =
        await this.intersolveVisaService.getWallet(tokenCode);
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        if (
          error.statusCode === HttpStatus.FORBIDDEN ||
          error.statusCode === HttpStatus.NOT_FOUND
        ) {
          throw new HttpException(
            `Card with code ${tokenCode} is not found.`,
            HttpStatus.NOT_FOUND,
          );
        } else {
          throw new HttpException(
            `${IntersolveVisa121ErrorText.getTokenError} - ${error.message}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    if (intersolveVisaChildWallet.holderId) {
      throw new HttpException(
        `Card is already linked to someone else.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async getWalletClosuresExport({
    programId,
  }: {
    programId: number;
  }): Promise<ExportVisaWalletClosure[]> {
    const rawData =
      await this.walletClosureScopedRepository.getForExport(programId);

    return rawData.map((row) => ({
      referenceId: row.referenceId,
      cardNumber: row.cardNumber,
      closedDate: row.closedDate,
      amountBookedBack: row.amountBookedBackInCents / 100,
    }));
  }

  public async createVisaCardOrder({
    programId,
    noOfCards,
    addressStreet,
    addressHouseNumber,
    addressHouseNumberAddition,
    addressPostalCode,
    addressCity,
    addressee,
    userId,
  }: {
    programId: number;
    noOfCards: number;
    addressStreet: string;
    addressHouseNumber: string;
    addressHouseNumberAddition?: string;
    addressPostalCode: string;
    addressCity: string;
    addressee: string;
    userId: number;
  }): Promise<{
    noOfCardsSent: number;
    noOfCardsOrdered: number;
  }> {
    const visaProgramFspConfigurations =
      await this.programFspConfigurationRepository.getByProgramIdAndFspName({
        programId,
        fspName: Fsps.intersolveVisa,
      });

    if (visaProgramFspConfigurations.length !== 1) {
      throw new HttpException(
        `Expected exactly 1 Intersolve Visa configuration for program ${programId}, found ${visaProgramFspConfigurations.length}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const programFspConfigurationId = visaProgramFspConfigurations[0].id;

    const cardDistributionByMail =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId,
          name: FspConfigurationProperties.cardDistributionByMail,
        },
      );

    if (cardDistributionByMail) {
      throw new HttpException(
        'Batch ordering Visa cards is only allowed when card distribution by mail is disabled.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const brandCode =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId,
          name: FspConfigurationProperties.brandCode,
        },
      );

    const coverLetterCode =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId,
          name: FspConfigurationProperties.coverLetterCode,
        },
      );

    const contactInformation: ContactInformation = {
      name: addressee,
      addressStreet,
      addressHouseNumber,
      addressHouseNumberAddition,
      addressPostalCode,
      addressCity,
      phoneNumber: env.INTERSOLVE_VISA_CARD_ORDER_PHONE_NUMBER,
    };

    let cardsSentByIntersolve = 0;
    let lastIntersolveErrorMessage: null | string = null;

    for (let index = 0; index < noOfCards; index++) {
      try {
        await this.intersolveVisaService.issueTokenAndCreatePhysicalCard({
          brandCode,
          coverLetterCode,
          contactInformation,
        });
        cardsSentByIntersolve += 1;
      } catch (error) {
        if (error instanceof IntersolveVisaApiError) {
          lastIntersolveErrorMessage = error.message;
          continue;
        }

        throw error;
      }
    }

    if (cardsSentByIntersolve === 0) {
      throw new HttpException(
        `Unable to order cards. ${lastIntersolveErrorMessage ?? 'Intersolve did not return a successful response.'}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const order = new VisaCardOrderEntity();
    order.programId = programId;
    order.userId = userId;
    order.noOfCards = noOfCards;
    order.noOfCardsOrdered = cardsSentByIntersolve;
    order.status = VisaCardOrderStatus.Completed;
    order.addressee = addressee;
    order.addressStreet = addressStreet;
    order.addressHouseNumber = addressHouseNumber;
    order.addressHouseNumberAddition = addressHouseNumberAddition ?? null;
    order.addressCity = addressCity;
    order.addressPostalCode = addressPostalCode;

    try {
      await this.cardOrderRepository.save(order);
    } catch (error) {
      throw new Error(
        'Cards were ordered, but saving the batch record failed. Please contact support for reconciliation.',
        { cause: error },
      );
    }
    const savedOrder = await this.cardOrderRepository.save(order);

    // Fire-and-forget: process card order in the background
    void this.cardOrderProcessorService
      .processCardOrder({
        order: savedOrder,
        brandCode: String(brandCode),
        coverLetterCode: String(coverLetterCode),
      })
      .catch((error: Error) => {
        this.azureLogService.logError(error, true);
      });

    return {
      noOfCardsSent: cardsSentByIntersolve,
      noOfCardsOrdered: noOfCards,
    };
  }

  public async getVisaCardOrders({
    programId,
  }: {
    programId: number;
  }): Promise<VisaCardOrderResponseDto[]> {
    const entities = await this.cardOrderRepository.getForProgram({
      programId,
    });

    return VisaCardOrderMapper.mapEntitiesToDtos({ entities });
  }
}
