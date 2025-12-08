import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisa121ErrorText } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { getFspAttributeNames } from '@121-service/src/fsp-management/fsp-settings.helpers';
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

  /**
   * This function reissues a visa card and sends a message.
   * - It first retrieves the registration associated with the given reference ID and program ID and he Intersolve Visa configuration for the program.
   * - It then checks that all required data fields are present in the registration data.
   * - It then calls the Intersolve Visa service to reissue the card with the registration data and Intersolve Visa configuration.
   * - Finally, it adds a message to the queue to be sent to the registration.
   *
   * @param {string} referenceId - The reference ID of the registration.
   * @param {number} programId - The ID of the program.
   * @throws {HttpException} Throws an HttpException if no registration is found for the given reference ID, if no registration data is found for the reference ID, or if a required data field is missing from the registration data.
   * @returns {Promise<void>}
   */
  public async reissueCardAndSendMessage(
    referenceId: string,
    programId: number,
    userId: number,
  ) {
    const registration = await this.getRegistrationAndReplaceCard({
      referenceId,
      programId,
    });

    if (userId) {
      await this.queueMessageService.addMessageJob({
        registration,
        messageTemplateKey: ProgramNotificationEnum.reissueVisaCard,
        messageContentType: MessageContentType.custom,
        messageProcessType:
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        userId,
      });
    }
  }

  public async getRegistrationAndReplaceCard({
    referenceId,
    programId,
    tokenCode,
  }: {
    referenceId: string;
    programId: number;
    tokenCode?: string;
  }): Promise<RegistrationEntity> {
    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        programId,
        relations: ['programFspConfiguration'],
      },
    );
    if (
      !registration.programFspConfigurationId ||
      registration.programFspConfiguration?.fspName !== Fsps.intersolveVisa
    ) {
      throw new HttpException(
        `This registration is not associated with the Intersolve Visa Fsp.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.replaceCard({
      registration,
      referenceId,
      programId,
      tokenCode,
    });

    return registration;
  }

  public async replaceCard({
    registration,
    referenceId,
    programId,
    tokenCode,
  }: {
    registration: RegistrationEntity;
    referenceId: string;
    programId: number;
    tokenCode?: string;
  }): Promise<void> {
    if (tokenCode) {
      await this.checkIfCardIsAlreadyLinked(tokenCode);
    }

    const dataFieldNames = getFspAttributeNames(Fsps.intersolveVisa);
    const contactInformation: ContactInformation =
      await this.registrationsService.getContactInformation({
        referenceId,
        programId,
        dataFieldNames,
      });

    if (this.validateContactInfo(contactInformation)) {
      await this.sendCustomerInformationToIntersolve({
        registration,
        contactInformation,
      });
    } else {
      throw new HttpException(
        `Fields are missing in contact informatoion`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const intersolveVisaConfig = await this.getIntersolveVisaConfig(
      registration.programFspConfigurationId,
    );
    const brandCode = intersolveVisaConfig.get(
      FspConfigurationProperties.brandCode,
    ) as string;
    const coverLetterCode = intersolveVisaConfig.get(
      FspConfigurationProperties.coverLetterCode,
    ) as string;

    try {
      await this.intersolveVisaService.reissueCard({
        registrationId: registration.id,
        reference: registration.referenceId,
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

  public async linkDebitCardToRegistration(
    referenceId: string,
    programId: number,
    tokenCode: string,
  ): Promise<void> {
    await this.checkIfCardIsAlreadyLinked(tokenCode);

    const registration: RegistrationEntity =
      await this.registrationsService.getRegistrationOrThrow({
        referenceId,
        programId,
      });

    const dataFieldNames = getFspAttributeNames(Fsps.intersolveVisa);
    const contactInformation =
      await this.registrationsService.getContactInformation({
        referenceId,
        programId,
        dataFieldNames,
      });

    const intersolveVisaCustomer =
      await this.intersolveVisaService.getCustomerOrCreate({
        registrationId: registration.id,
        createCustomerReference: referenceId,
        contactInformation,
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

  /**
   * Retrieves a registration by reference ID and program ID, and sends its contact information to Intersolve. Used only for debugging purposes.
   */
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

    const dataFieldNames = getFspAttributeNames(Fsps.intersolveVisa);
    const contactInformation: ContactInformation =
      await this.registrationsService.getContactInformation({
        referenceId,
        programId,
        dataFieldNames,
      });

    await this.sendCustomerInformationToIntersolve({
      registration,
      contactInformation,
    });
  }

  public async sendCustomerInformationToIntersolve({
    registration,
    contactInformation,
  }: {
    registration: RegistrationEntity;
    contactInformation: ContactInformation;
  }): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);

    if (registrationHasVisaCustomer) {
      await this.intersolveVisaService.sendUpdatedCustomerInformation({
        registrationId: registration.id,
        contactInformation,
      });
    }
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

  private validateContactInfo(contactInformation: ContactInformation) {
    if (!contactInformation.name) {
      return false;
    }

    for (const field in contactInformation) {
      if (field === FspAttributes.addressHouseNumberAddition) continue; // Optional field
      if (!contactInformation[field]) {
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
