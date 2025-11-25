import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisa121ErrorText } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';
import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utils/registration-utils.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class DebitCardsIntersolveVisaService {
  public constructor(
    private readonly queueMessageService: MessageQueuesService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
  ) {}

  public async retrieveAndUpdateIntersolveVisaWalletAndCards(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const registration =
      await this.registrationUtilsService.getRegistrationOrThrow({
        referenceId,
        relations: [],
        programId,
      });
    return await this.intersolveVisaService.retrieveAndUpdateWallet(
      registration.id,
    );
  }

  public async getIntersolveVisaWalletAndCards(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const registration =
      await this.registrationUtilsService.getRegistrationOrThrow({
        referenceId,
        relations: [],
        programId,
      });
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
    const registration =
      await this.registrationUtilsService.getRegistrationOrThrow({
        referenceId,
        programId,
        relations: ['programFspConfiguration'],
      });
    if (
      !registration.programFspConfigurationId ||
      registration.programFspConfiguration?.fspName !== Fsps.intersolveVisa
    ) {
      throw new HttpException(
        `This registration is not associated with the Intersolve Visa Fsp.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const intersolveVisaConfig = await this.getIntersolveVisaConfig(
      registration.programFspConfigurationId,
    );

    //  TODO: REFACTOR: This 'ugly' code is now also in payments.service.createAndAddIntersolveVisaTransactionJobs. This should be refactored when there's a better way of getting registration data.
    const intersolveVisaAttributes =
      FSP_SETTINGS[Fsps.intersolveVisa].attributes;

    const intersolveVisaAttributeNames = intersolveVisaAttributes.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      FspAttributes.fullName,
      FspAttributes.phoneNumber,
      ...intersolveVisaAttributeNames,
    ];

    const registrationData =
      await this.registrationDataScopedRepository.getRegistrationDataArrayByName(
        registration,
        dataFieldNames,
      );

    if (!registrationData || registrationData.length === 0) {
      throw new HttpException(
        `No registration data found for referenceId: ${referenceId}`,
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

    for (const name of dataFieldNames) {
      if (name === FspAttributes.addressHouseNumberAddition) continue; // Skip non-required property
      if (
        mappedRegistrationData[name] === null ||
        mappedRegistrationData[name] === undefined ||
        mappedRegistrationData[name] === ''
      ) {
        throw new HttpException(
          `Property ${name} is undefined`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    await this.sendCustomerInformationToIntersolve(registration);

    const brandCode = intersolveVisaConfig.get(
      FspConfigurationProperties.brandCode,
    ) as string;

    try {
      await this.intersolveVisaService.reissueCard({
        registrationId: registration.id,
        // Why do we need this?
        reference: registration.referenceId,
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
          phoneNumber: mappedRegistrationData[FspAttributes.phoneNumber], // In the above for loop it is checked that this is not undefined or empty
        },
        brandCode,
        coverLetterCode: brandCode,
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

    await this.queueMessageService.addMessageJob({
      registration,
      messageTemplateKey: ProgramNotificationEnum.reissueVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      userId,
    });
  }

  public async sendCustomerInformationToIntersolve(
    registration: RegistrationEntity,
  ): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (registrationHasVisaCustomer) {
      type CustomerInformationKeys =
        | keyof ContactInformation
        | FspAttributes.fullName; // Full name is not part of ContactInformation, but still needs to be updated via the same process
      const fieldNames: CustomerInformationKeys[] = [
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

      await this.intersolveVisaService.sendUpdatedCustomerInformation({
        registrationId: registration.id,
        contactInformation: {
          addressStreet: mappedRegistrationData[`addressStreet`],
          addressHouseNumber: mappedRegistrationData[`addressHouseNumber`],
          addressHouseNumberAddition:
            mappedRegistrationData[`addressHouseNumberAddition`],
          addressPostalCode: mappedRegistrationData[`addressPostalCode`],
          addressCity: mappedRegistrationData[`addressCity`],
          phoneNumber: mappedRegistrationData[`phoneNumber`],
        },
        name: mappedRegistrationData[`fullName`],
      });
    }
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
    await this.sendCustomerInformationToIntersolve(registration);
  }

  public async linkDebitCardToRegistration(
    referenceId: string,
    programId: number,
    tokenCode: string,
  ): Promise<void> {
    // Check if card exists and is unlinked
    const intersolveVisaChildWallet =
      await this.intersolveVisaService.getWallet(tokenCode);

    if (intersolveVisaChildWallet.holderId !== null) {
      throw new HttpException(
        `Card is alrealdy linked to another customer at Intersolve.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const registrationView =
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        {
          programId,
          referenceIds: [referenceId],
        },
      );

    const contactInformation: ContactInformation = {
      addressStreet: registrationView[0]['addressStreet'],
      addressHouseNumber: registrationView[0]['addressHouseNumber'],
      addressHouseNumberAddition:
        registrationView[0]['addressHouseNumberAddition'],
      addressPostalCode: registrationView[0]['addressPostalCode'],
      addressCity: registrationView[0]['addressCity'],
      phoneNumber: String(registrationView[0]['phoneNumber']),
    };

    const intersolveVisaCustomer =
      await this.intersolveVisaService.getCustomerOrCreate({
        registrationId: registrationView[0]['id'],
        createCustomerReference: referenceId,
        name: String(registrationView[0]['name']),
        contactInformation,
      });

    const intersolveVisaConfig = await this.getIntersolveVisaConfig(
      registrationView[0]['programFspConfigurationId'],
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

  public async replaceCard(
    referenceId: string,
    programId: number,
    tokenCode: string,
  ): Promise<void> {
    // Check if card exists and is unlinked
    const intersolveVisaChildWallet =
      await this.intersolveVisaService.getWallet(tokenCode);

    if (intersolveVisaChildWallet.holderId !== null) {
      throw new HttpException(
        `Card is alrealdy linked to another customer at Intersolve.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const registrationView =
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        {
          programId,
          referenceIds: [referenceId],
        },
      );

    const contactInformation: ContactInformation = {
      addressStreet: registrationView[0]['addressStreet'],
      addressHouseNumber: registrationView[0]['addressHouseNumber'],
      addressHouseNumberAddition:
        registrationView[0]['addressHouseNumberAddition'],
      addressPostalCode: registrationView[0]['addressPostalCode'],
      addressCity: registrationView[0]['addressCity'],
      phoneNumber: String(registrationView[0]['phoneNumber']),
    };

    const intersolveVisaConfig = await this.getIntersolveVisaConfig(
      registrationView[0]['programFspConfigurationId'],
    );

    const brandCode = intersolveVisaConfig.get(
      FspConfigurationProperties.brandCode,
    ) as string;

    const coverLetterCode = intersolveVisaConfig.get(
      FspConfigurationProperties.coverLetterCode,
    ) as string;

    return await this.intersolveVisaService.reissueCard({
      registrationId: registrationView[0]['id'],
      reference: referenceId,
      name: String(registrationView[0]['name']),
      contactInformation,
      brandCode,
      coverLetterCode,
      physicalCardToken: tokenCode,
    });
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
