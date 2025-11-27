import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.service';
import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisa121ErrorText } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

@Injectable()
export class IntersolveVisaAccountManagementService {
  public constructor(
    private readonly queueMessageService: MessageQueuesService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly registrationsService: RegistrationsService,
    private readonly intersolveVisaDataSynchronizationService: IntersolveVisaDataSynchronizationService,
    private readonly intersolveVisaChildWalletScopedRepository: IntersolveVisaChildWalletScopedRepository,
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
    return await this.intersolveVisaService.retrieveAndUpdateWallet(
      registration.id,
    );
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
    return await this.intersolveVisaService.getWalletWithCards(registration.id);
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

    await this.queueMessageService.addMessageJob({
      registration,
      messageTemplateKey: ProgramNotificationEnum.reissueVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
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
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId,
        name: FspConfigurationProperties.brandCode,
      });
    const coverLetterCode =
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId,
        name: FspConfigurationProperties.coverLetterCode,
      });
    if (typeof brandCode !== 'string' || typeof coverLetterCode !== 'string') {
      throw new HttpException(
        'Missing or invalid brandCode or coverLetterCode for Intersolve Visa replace card',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.intersolveVisaService.reissueCard({
        registrationId,
        contactInformation,
        brandCode,
        coverLetterCode,
        physicalCardToken: tokenCode,
      });
    } catch (error) {
      if (error instanceof IntersolveVisaApiError) {
        throw new HttpException(
          `${IntersolveVisa121ErrorText.reissueCard} - ${error.message}`,
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
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId: registration.programFspConfigurationId,
        name: FspConfigurationProperties.brandCode,
      });
    if (typeof brandCode !== 'string') {
      throw new HttpException(
        'Missing or invalid brandCode for Intersolve Visa link card on-site',
        HttpStatus.BAD_REQUEST,
      );
    }

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
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId,
        name: FspConfigurationProperties.cardDistributionByMail,
      });

    return cardDistributionByMail === 'true';
  }

  public async pauseCardAndSendMessage(
    referenceId: string,
    programId: number,
    tokenCode: string,
    pause: boolean,
    userId: number,
  ): Promise<IntersolveVisaChildWalletEntity> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        programId,
      },
    );
    const updatedWallet = await this.intersolveVisaService.pauseCardOrThrow(
      tokenCode,
      pause,
    );
    await this.queueMessageService.addMessageJob({
      registration,
      messageTemplateKey: pause
        ? ProgramNotificationEnum.pauseVisaCard
        : ProgramNotificationEnum.unpauseVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      userId,
    });
    return updatedWallet;
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

  public async linkDebitCardToRegistration(
    referenceId: string,
    programId: number,
    tokenCode: string,
  ): Promise<void> {
    await this.checkIfCardIsAlreadyLinked(tokenCode);

    const registration: RegistrationEntity =
      await this.registrationUtilsService.getRegistrationOrThrow({
        referenceId,
        programId,
      });

    const contactInfo = await this.getContactInformation(registration);

    const intersolveVisaCustomer =
      await this.intersolveVisaService.getCustomerOrCreate({
        registrationId: registration.id,
        createCustomerReference: referenceId,
        ...contactInfo,
      });

    const intersolveVisaConfig = await this.getIntersolveVisaConfig(
      registration.programFspConfigurationId,
    );

    const brandCode = intersolveVisaConfig.get(
      FspConfigurationProperties.brandCode,
    ) as string;

    const intersolveVisaParentWallet =
      await this.intersolveVisaService.getParentWalletOrCreate({
        intersolveVisaCustomer,
        brandCode,
      });

    await this.intersolveVisaService.linkParentWalletToCustomerIfUnlinked({
      intersolveVisaCustomer,
      intersolveVisaParentWallet,
    });

    await this.intersolveVisaService.linkWallets({
      parentTokenCode: intersolveVisaParentWallet.tokenCode,
      childTokenCode: tokenCode,
    });
  }

  /**
   * Pauses or unpauses a card associated with a given token code and sends a message to the registration.
   * - It retrieves the registration, pauses or unpauses the card, sends a message to the registration, and returns the updated wallet.
   *
   * @param {string} referenceId - The reference ID of the registration.
   * @param {number} programId - The ID of the program.
   * @param {string} tokenCode - The token code of the card to pause or unpause.
   * @param {boolean} pause - Whether to pause (true) or unpause (false) the card.
   * @throws {HttpException} Throws an HttpException if no registration is found for the given reference ID.
   * @returns {Promise<IntersolveVisaChildWalletEntity>} The updated wallet.
   */
  public async pauseCardAndSendMessage(
    referenceId: string,
    programId: number,
    tokenCode: string,
    pause: boolean,
    userId: number,
  ): Promise<IntersolveVisaChildWalletEntity> {
    const registration =
      await this.registrationUtilsService.getRegistrationOrThrow({
        referenceId,
        programId,
      });
    const updatedWallet = await this.intersolveVisaService.pauseCardOrThrow(
      tokenCode,
      pause,
    );
    await this.queueMessageService.addMessageJob({
      registration,
      messageTemplateKey: pause
        ? ProgramNotificationEnum.pauseVisaCard
        : ProgramNotificationEnum.unpauseVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      userId,
    });
    return updatedWallet;
  }

  /**
   * Retrieves a registration by reference ID and program ID, and sends its contact information to Intersolve. Used only for debugging purposes.
   */
  public async getRegistrationAndSendContactInformationToIntersolve(
    referenceId: string,
    programId: number,
  ): Promise<void> {
    const registration =
      await this.registrationUtilsService.getRegistrationOrThrow({
        referenceId,
        programId,
      });
    const contactInfo: DebitCardsContactInfo =
      await this.getContactInformation(registration);
    await this.sendCustomerInformationToIntersolve({
      registration,
      contactInfo,
    });
  }

  public async sendCustomerInformationToIntersolve({
    registration,
    contactInfo,
  }: {
    registration: RegistrationEntity;
    contactInfo: DebitCardsContactInfo;
  }): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);

    if (registrationHasVisaCustomer) {
      await this.intersolveVisaService.sendUpdatedCustomerInformation({
        registrationId: registration.id,
        ...contactInfo,
      });
    }
  }

  public async getContactInformation(
    registration: RegistrationEntity,
  ): Promise<DebitCardsContactInfo> {
    const fieldNames: DebitCardsContactInfoKeys[] = [
      FspAttributes.addressStreet,
      FspAttributes.addressHouseNumber,
      FspAttributes.addressHouseNumberAddition,
      FspAttributes.addressPostalCode,
      FspAttributes.addressCity,
      FspAttributes.phoneNumber,
      FspAttributes.fullName,
    ];

    const registrationData =
      await this.registrationDataScopedRepository.getRegistrationDataArrayByName(
        registration,
        fieldNames,
      );

    if (!registrationData || registrationData.length === 0) {
      throw new HttpException(
        `No registration data found for referenceId: ${registration.referenceId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const mappedRegistrationData = registrationData.reduce(
      (acc, { name, value }) => {
        acc[name] = value;
        return acc;
      },
      {},
    );

    return {
      name: mappedRegistrationData[FspAttributes.fullName],
      contactInformation: {
        addressStreet: mappedRegistrationData[FspAttributes.addressStreet],
        addressHouseNumber:
          mappedRegistrationData[FspAttributes.addressHouseNumber],
        addressHouseNumberAddition:
          mappedRegistrationData[FspAttributes.addressHouseNumberAddition],
        addressPostalCode:
          mappedRegistrationData[FspAttributes.addressPostalCode],
        addressCity: mappedRegistrationData[FspAttributes.addressCity],
        phoneNumber: mappedRegistrationData[FspAttributes.phoneNumber],
      },
    };
  }

  private async checkIfCardIsAlreadyLinked(tokenCode: string): Promise<void> {
    const intersolveVisaChildWallet =
      await this.intersolveVisaService.getWallet(tokenCode);

    if (intersolveVisaChildWallet.holderId) {
      throw new HttpException(
        `Card is already linked to another customer at Intersolve.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateContactInfo(contactInfo: DebitCardsContactInfo) {
    if (!contactInfo.name) {
      return false;
    }

    for (const field in contactInfo.contactInformation) {
      if (field === FspAttributes.addressHouseNumberAddition) continue; // Optional field
      if (!contactInfo.contactInformation[field]) {
        return false;
      }
    }

    return true;
  }

  private async getIntersolveVisaConfig(
    programFspConfigurationId: number,
  ): Promise<Map<FspConfigurationProperties, string | string[]>> {
    const properties =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId,
        names: [
          FspConfigurationProperties.brandCode,
          FspConfigurationProperties.coverLetterCode,
        ],
      });

    const configMap = new Map<FspConfigurationProperties, string | string[]>();

    properties.forEach(({ name, value }) => {
      configMap.set(name, value);
    });

    return configMap;
  }
}
