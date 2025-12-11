import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.service';
import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisa121ErrorText } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
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

    const hasIntersolveVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (!hasIntersolveVisaCustomer) {
      throw new HttpException(
        'No Intersolve Visa customer found for this registration.',
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

    const hasIntersolveVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (!hasIntersolveVisaCustomer) {
      throw new HttpException(
        'No Intersolve Visa customer found for this registration.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.throwIfCardDoesNotExistOrIsAlreadyLinked(tokenCode);

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
    //TODO:
    // Throws if tokenCode (card) does not exist
    // We opened a ticket at Intersoleve to improve their error codes/messages
    // For now the response code is unreliable; it sometimes returns 404, sometimes 500
    const intersolveVisaChildWallet =
      await this.intersolveVisaService.getWallet(tokenCode);

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
      await this.registrationsService.getRegistrationOrThrow({
        referenceId,
        programId,
      });

    const contactInformation =
      await this.registrationsService.getContactInformation({
        referenceId,
        programId,
      });

    const intersolveVisaCustomer =
      await this.intersolveVisaService.getCustomerOrCreate({
        registrationId: registration.id,
        createCustomerReference: referenceId,
        contactInformation,
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
    //TODO:
    // Throws if tokenCode (card) does not exist
    // We opened a ticket at Intersoleve to improve their error codes/messages
    // For now the response code is unreliable; it sometimes returns 404, sometimes 500
    const intersolveVisaChildWallet =
      await this.intersolveVisaService.getWallet(tokenCode);

    if (intersolveVisaChildWallet.holderId) {
      throw new HttpException(
        `Card is already linked to someone else.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
