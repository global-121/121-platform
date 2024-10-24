import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Equal, Repository } from 'typeorm';

import { EventsService } from '@121-service/src/events/events.service';
import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { findFinancialServiceProviderByNameOrFail } from '@121-service/src/financial-service-providers/financial-service-providers.helpers';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { IntersolveVisaWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import {
  ImportRegistrationsDto,
  ImportResult,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { CreateRegistrationDto } from '@121-service/src/registration/dto/create-registration.dto';
import { CustomDataDto } from '@121-service/src/registration/dto/custom-data.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { MessageHistoryDto } from '@121-service/src/registration/dto/message-history.dto';
import { ReferenceProgramIdScopeDto } from '@121-service/src/registration/dto/registrationProgramIdScope.dto';
import {
  AdditionalAttributes,
  Attributes,
  UpdateAttributeDto,
  UpdateRegistrationDto,
} from '@121-service/src/registration/dto/update-registration.dto';
import {
  DefaultRegistrationDataAttributeNames,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import {
  RegistrationStatusEnum,
  RegistrationStatusTimestampField,
} from '@121-service/src/registration/enum/registration-status.enum';
import { ErrorEnum } from '@121-service/src/registration/errors/registration-data.error';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserService } from '@121-service/src/user/user.service';
import { convertToScopedOptions } from '@121-service/src/utils/scope/createFindWhereOptions.helper';
import { IntersolveVisaApiError } from '../payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisa121ErrorText } from '../payments/fsp-integration/intersolve-visa/enums/intersolve-visa-121-error-text.enum';

@Injectable()
export class RegistrationsService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  public constructor(
    private readonly lookupService: LookupService,
    private readonly queueMessageService: MessageQueuesService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly registrationsImportService: RegistrationsImportService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly userService: UserService,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly eventsService: EventsService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
  ) {}

  // This methods can be used to get the same formattted data as the pagination query using referenceId
  public async getPaginateRegistrationForReferenceId(
    referenceId: string,
    programId: number,
  ) {
    const queryBuilder = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({ referenceId });
    const paginateResult =
      await this.registrationsPaginationService.getPaginate(
        { path: '' },
        programId,
        true,
        false,
        queryBuilder,
      );
    return paginateResult.data[0];
  }

  // This methods can be used to get the same formattted data as the pagination query using referenceId
  public async getPaginateRegistrationById({
    id,
    programId,
  }: {
    id: number;
    programId: number;
  }) {
    const queryBuilder = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({
        id,
      });
    const paginateResult =
      await this.registrationsPaginationService.getPaginate(
        { path: '' },
        programId,
        true,
        false,
        queryBuilder,
      );
    return paginateResult.data[0];
  }

  private async findUserOrThrow(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: Equal(userId) },
    });
    if (!user) {
      const errors = 'This user is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  public async create(
    postData: CreateRegistrationDto,
    programId: number,
    userId: number,
  ): Promise<RegistrationViewEntity> {
    const user = await this.findUserOrThrow(userId);
    const registration = new RegistrationEntity();
    registration.referenceId = postData.referenceId;
    registration.user = user;
    registration.program = await this.programRepository.findOneByOrFail({
      id: programId,
    });
    await this.registrationUtilsService.save(registration);
    return this.setRegistrationStatus(
      postData.referenceId,
      RegistrationStatusEnum.registered,
    );
  }

  private async setRegistrationStatus(
    referenceId: string,
    status: RegistrationStatusEnum,
  ): Promise<RegistrationViewEntity> {
    const registrationBeforeUpdate =
      await this.registrationViewScopedRepository.findOneOrFail({
        where: { referenceId: Equal(referenceId) },
        select: ['id', 'status'],
      });
    await this.registrationScopedRepository.updateUnscoped(
      { referenceId },
      { registrationStatus: status },
    );
    const registrationAfterUpdate =
      await this.registrationViewScopedRepository.findOneOrFail({
        where: { referenceId: Equal(referenceId) },
        select: ['id', 'status'],
      });
    await this.eventsService.log(
      registrationBeforeUpdate,
      registrationAfterUpdate,
      { registrationAttributes: ['status'] },
    );
    return registrationAfterUpdate;
  }

  public canChangeStatus(
    currentStatus: RegistrationStatusEnum,
    newStatus: RegistrationStatusEnum,
  ): boolean {
    let result = false;
    switch (newStatus) {
      case RegistrationStatusEnum.registered:
        result = false;
        break;
      case RegistrationStatusEnum.validated:
        result = [RegistrationStatusEnum.registered].includes(currentStatus);
        break;
      case RegistrationStatusEnum.declined:
        result = [
          RegistrationStatusEnum.included,
          RegistrationStatusEnum.paused,
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.validated,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.included:
        result = [
          RegistrationStatusEnum.completed,
          RegistrationStatusEnum.declined,
          RegistrationStatusEnum.deleted,
          RegistrationStatusEnum.paused,
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.validated,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.deleted:
        result = [
          RegistrationStatusEnum.completed,
          RegistrationStatusEnum.declined,
          RegistrationStatusEnum.included,
          RegistrationStatusEnum.paused,
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.validated,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.completed:
        result = [
          RegistrationStatusEnum.deleted,
          RegistrationStatusEnum.included,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.paused:
        result = [
          RegistrationStatusEnum.deleted,
          RegistrationStatusEnum.included,
        ].includes(currentStatus);
        break;
    }
    return result;
  }

  public async getRegistrationOrThrow({
    referenceId,
    relations = [],
    programId,
  }: {
    referenceId: string;
    relations?: (keyof RegistrationEntity)[];
    programId?: number;
  }): Promise<RegistrationEntity> {
    if (!referenceId) {
      const errors = `ReferenceId is not set`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const registration =
      await this.registrationScopedRepository.getWithRelationsByReferenceIdAndProgramId(
        {
          referenceId,
          relations,
          programId,
        },
      );
    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known in this program (within your scope).`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return registration;
  }

  public async addFsp(
    referenceId: string,
    programFinancialServiceProviderConfigurationId: number,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
    });
    const fspConfig =
      await this.programFinancialServiceProviderConfigurationRepository.findOneOrFail(
        {
          where: { id: Equal(programFinancialServiceProviderConfigurationId) },
          relations: ['questions'],
        },
      );
    registration.programFinancialServiceProviderConfiguration = fspConfig;
    return await this.registrationUtilsService.save(registration);
  }

  public async addRegistrationDataBulk(
    dataArray: CustomDataDto[],
  ): Promise<RegistrationEntity[]> {
    const registrations: RegistrationEntity[] = [];
    for (const data of dataArray) {
      const registration = await this.addRegistrationData(
        data.referenceId,
        data.key,
        data.value,
      );
      registrations.push(registration);
    }
    return registrations;
  }

  public async addRegistrationData(
    referenceId: string,
    customDataKey: string,
    customDataValueRaw: string | string[],
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationOrThrow({
      referenceId,
    });
    const customDataValue = await this.cleanCustomDataIfPhoneNr(
      customDataKey,
      customDataValueRaw,
      registration.programId,
    );
    return await this.registrationDataService.saveData(
      registration,
      customDataValue,
      {
        name: customDataKey,
      },
    );
  }

  public async cleanCustomDataIfPhoneNr(
    customDataKey: string,
    customDataValue: string | number | string[],
    programId: number,
  ) {
    const allowEmptyPhoneNumber = (
      await this.programRepository.findOneBy({
        id: programId,
      })
    )?.allowEmptyPhoneNumber;

    const answersTypeTel: string[] = [];
    const programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: { type: Equal(RegistrationAttributeTypes.tel) },
      });
    for (const question of programRegistrationAttributes) {
      answersTypeTel.push(question.name);
    }

    if (!answersTypeTel.includes(customDataKey)) {
      return customDataValue;
    }

    if (
      !allowEmptyPhoneNumber &&
      customDataKey === DefaultRegistrationDataAttributeNames.phoneNumber
    ) {
      // phoneNumber cannot be empty
      if (!customDataValue) {
        throw new HttpException(
          'Phone number cannot be empty',
          HttpStatus.BAD_REQUEST,
        );
      }
      // otherwise check
      return await this.lookupService.lookupAndCorrect(String(customDataValue));
    }

    if (!customDataValue) {
      // other tel-types (e.g. whatsappPhoneNumber) can be empty
      return customDataValue;
    }
    // otherwise check
    return await this.lookupService.lookupAndCorrect(String(customDataValue));
  }

  public async getImportRegistrationsTemplate(
    programId: number,
  ): Promise<string[]> {
    return await this.registrationsImportService.getImportRegistrationsTemplate(
      programId,
    );
  }

  public async importRegistrations(
    csvFile,
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.registrationsImportService.importRegistrations(
      csvFile,
      program,
      userId,
    );
  }

  public async patchBulk(
    csvFile: any,
    programId: number,
    userId: number,
    reason: string,
  ): Promise<void> {
    return await this.registrationsImportService.patchBulk(
      csvFile,
      programId,
      userId,
      reason,
    );
  }

  public async importRegistrationFromJson(
    validatedJsonData: ImportRegistrationsDto[],
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    if (!program?.published) {
      const errors =
        'Registrations are not allowed for this program yet, try again later.';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    const validateRegistrationsInput =
      await this.registrationsImportService.validateImportAsRegisteredInput(
        validatedJsonData,
        programId,
        userId,
      );
    return await this.registrationsImportService.importValidatedRegistrations(
      validateRegistrationsInput,
      program,
      userId,
    );
  }

  private async findProgramOrThrow(programId: number): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations: ['programRegistrationAttributes'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public transformRegistrationByNamingConvention(
    nameColumns: string[],
    registrationObject: MappedPaginatedRegistrationDto, // Allow dynamic key access
  ): MappedPaginatedRegistrationDto {
    const fullnameConcat: string[] = [];

    // Loop through nameColumns and access properties dynamically
    for (const nameColumn of nameColumns) {
      if (registrationObject[nameColumn]) {
        fullnameConcat.push(registrationObject[nameColumn]);
        delete registrationObject[nameColumn]; // Remove original properties
      }
    }

    // Concatenate the full name and assign to the 'name' property
    registrationObject.name = fullnameConcat.join(' ');

    return registrationObject; // Return the modified object
  }

  public getDateFieldPerStatus(
    filterStatus: RegistrationStatusEnum,
  ): RegistrationStatusTimestampField {
    switch (filterStatus) {
      case RegistrationStatusEnum.registered:
        return RegistrationStatusTimestampField.registeredDate;
      case RegistrationStatusEnum.validated:
        return RegistrationStatusTimestampField.validationDate;
      case RegistrationStatusEnum.included:
        return RegistrationStatusTimestampField.inclusionDate;
      case RegistrationStatusEnum.deleted:
        return RegistrationStatusTimestampField.deleteDate;
      case RegistrationStatusEnum.completed:
        return RegistrationStatusTimestampField.completedDate;
      case RegistrationStatusEnum.paused:
        return RegistrationStatusTimestampField.pausedDate;
      case RegistrationStatusEnum.declined:
        return RegistrationStatusTimestampField.declinedDate;
    }
  }

  public async updateRegistration(
    programId: number,
    referenceId: string,
    updateRegistrationDto: UpdateRegistrationDto,
  ) {
    let nrAttributesUpdated = 0;
    const { data: partialRegistration } = updateRegistrationDto;

    let registrationToUpdate = await this.getRegistrationOrThrow({
      referenceId,
      relations: ['program', 'programFinancialServiceProviderConfiguration'],
      programId,
    });

    // ##TODO Also enable updating the FSP configuration in this function

    const oldViewRegistration =
      await this.getPaginateRegistrationForReferenceId(referenceId, programId);

    // Track whether maxPayments has been updated to match paymentCount
    let maxPaymentsMatchesPaymentCount = false;

    for (const attributeKey of Object.keys(partialRegistration)) {
      const attributeValue: string | number | string[] =
        typeof partialRegistration[attributeKey] === 'boolean'
          ? String(partialRegistration[attributeKey])
          : partialRegistration[attributeKey];

      const oldValue = oldViewRegistration[attributeKey];

      if (String(oldValue) !== String(attributeValue)) {
        if (
          attributeKey === 'maxPayments' &&
          Number(attributeValue) === registrationToUpdate.paymentCount
        ) {
          maxPaymentsMatchesPaymentCount = true;
        }
        registrationToUpdate = await this.updateAttribute(
          attributeKey,
          attributeValue,
          registrationToUpdate,
        );
        nrAttributesUpdated++;
      }
    }

    if (maxPaymentsMatchesPaymentCount) {
      registrationToUpdate = await this.updateAttribute(
        'registrationStatus',
        RegistrationStatusEnum.completed,
        registrationToUpdate,
      );
      nrAttributesUpdated++; // Increment for registrationStatus update
    }

    const newRegistration = await this.getPaginateRegistrationForReferenceId(
      referenceId,
      programId,
    );

    if (nrAttributesUpdated > 0) {
      await this.inclusionScoreService.calculateInclusionScore(referenceId);
      await this.eventsService.log(
        { ...oldViewRegistration },
        { ...newRegistration },
        {
          additionalLogAttributes: { reason: updateRegistrationDto.reason },
        },
      );
      return newRegistration;
    }
  }

  private async updateAttribute(
    attribute: Attributes | string,
    value: string | number | string[],
    registration: RegistrationEntity,
  ): Promise<RegistrationEntity> {
    value = await this.cleanCustomDataIfPhoneNr(
      attribute,
      value,
      registration.programId,
    );

    if (typeof registration[attribute] !== 'undefined') {
      registration[attribute] = value;
    }

    // This checks registration attributes (like paymentAmountMultiplier)
    const errors = await validate(registration);
    if (errors.length > 0) {
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    if (
      !Object.values(AdditionalAttributes).includes(
        attribute as AdditionalAttributes,
      )
    ) {
      try {
        await this.registrationDataService.saveData(registration, value, {
          name: attribute,
        });
      } catch (error) {
        // This is an exception because the phoneNumber is in the registration entity, not in the registrationData.
        if (attribute === Attributes.phoneNumber) {
          registration.phoneNumber = value.toString();
          await this.registrationUtilsService.save(registration);
        } else {
          if (error.name !== ErrorEnum.RegistrationDataError) {
            throw error;
          }
        }
      }
    }
    const savedRegistration =
      await this.registrationUtilsService.save(registration);
    const calculatedRegistration =
      await this.inclusionScoreService.calculatePaymentAmountMultiplier(
        registration.program,
        registration.referenceId,
      );
    if (calculatedRegistration) {
      return this.getRegistrationOrThrow({
        referenceId: calculatedRegistration.referenceId,
      });
    }

    if (process.env.SYNC_WITH_THIRD_PARTIES) {
      await this.sendContactInformationToIntersolve(registration);
    }

    return this.getRegistrationOrThrow({
      referenceId: savedRegistration.referenceId,
      relations: ['program'],
    });
  }

  private async sendContactInformationToIntersolve(
    registration: RegistrationEntity,
  ): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (registrationHasVisaCustomer) {
      // TODO: REFACTOR: Find a way to not have the data fields hardcoded in this function. -> can be implemented in registration data refeactor
      type ContactInformationKeys = keyof ContactInformation;
      const fieldNames: ContactInformationKeys[] = [
        'addressStreet',
        'addressHouseNumber',
        'addressHouseNumberAddition',
        'addressPostalCode',
        'addressCity',
        'phoneNumber',
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

      await this.intersolveVisaService.sendUpdatedContactInformation({
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
      });
    }
  }

  public async searchRegistration(rawPhoneNumber: string, userId: number) {
    const phoneNumber = await this.lookupService.lookupAndCorrect(
      rawPhoneNumber,
      true,
    );
    if (!phoneNumber) {
      return [];
    }

    const customAttributesPhoneNumberNames = [
      DefaultRegistrationDataAttributeNames.phoneNumber as string,
      DefaultRegistrationDataAttributeNames.whatsappPhoneNumber as string,
    ];

    const matchingRegistrations = (
      await this.registrationScopedRepository.find({
        where: { phoneNumber: Equal(phoneNumber) },
      })
    ).map((r) => {
      return {
        programId: r.programId,
        referenceId: r.referenceId,
        scope: r.scope,
      };
    });
    const matchingRegistrationData = await this.registrationDataScopedRepository
      .createQueryBuilder('registrationData')
      .leftJoinAndSelect('registrationData.registration', 'registration')
      .andWhere('registrationData.value = :phoneNumber', {
        phoneNumber,
      })
      .getMany();

    for (const d of matchingRegistrationData) {
      const dataName = await d.getDataName();
      if (dataName && customAttributesPhoneNumberNames.includes(dataName)) {
        matchingRegistrations.push({
          programId: d.registration.programId,
          referenceId: d.registration.referenceId,
          scope: d.registration.scope,
        });
      }
    }

    const uniqueRegistrations = matchingRegistrations.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.referenceId === value.referenceId),
    );

    const filteredRegistrations = await this.filterRegistrationsByProgramScope(
      uniqueRegistrations,
      userId,
    );

    return await Promise.all(
      filteredRegistrations.map(async (uniqueRegistration) => {
        return await this.getPaginateRegistrationForReferenceId(
          uniqueRegistration.referenceId,
          uniqueRegistration.programId,
        );
      }),
    );
  }

  private async filterRegistrationsByProgramScope(
    registrationObjects: ReferenceProgramIdScopeDto[],
    userId: number,
  ): Promise<ReferenceProgramIdScopeDto[]> {
    const filteredRegistrations: ReferenceProgramIdScopeDto[] = [];
    const programIdScopeObjects =
      await this.userService.getProgramScopeIdsUserHasPermission(
        userId,
        PermissionEnum.RegistrationPersonalREAD,
      );
    for (const registration of registrationObjects) {
      // Filters out registrations of programs to which this user is not assigned
      const programIdScopeObject = programIdScopeObjects.find(
        (p) => p.programId === registration.programId,
      );

      if (programIdScopeObject) {
        // Filters out registrations of a program to which this user is assigned, but not to the scope of the registration
        const findProgramOption = {
          where: {
            programId: Equal(registration.programId),
            referenceId: Equal(registration.referenceId),
          },
        };
        const findOption = convertToScopedOptions<RegistrationEntity>(
          findProgramOption,
          [],
          programIdScopeObject.scope,
        );
        const foundRegistration =
          await this.registrationScopedRepository.findOne(findOption);

        if (foundRegistration) {
          filteredRegistrations.push(registration);
        }
      }
    }
    return filteredRegistrations;
  }

  public async updateChosenFspConfiguration({
    referenceId,
    newFspConfigurationName: newFspConfigurationName,
    userId,
  }: {
    referenceId: string;
    newFspConfigurationName: string;
    userId: number;
  }) {
    //Identify new FSP
    const newFspConfig =
      await this.programFinancialServiceProviderConfigurationRepository.findOne(
        {
          where: { name: Equal(newFspConfigurationName) },
        },
      );
    if (!newFspConfig) {
      const errors = `FSP with this name not found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // ###TODO: Use the new FSP configuration to check if required attributes are already stored with the registration

    // Check if required attributes are present
    // newFsp.questions.forEach((requiredAttribute) => {
    //   if (!Object.keys(newFspAttributesRaw).includes(requiredAttribute.name)) {
    //     const requiredAttributes = newFsp.questions
    //       .map((a) => a.name)
    //       .join(', ');
    //     const errors = `Not all required FSP attributes provided correctly: ${requiredAttributes}`;
    //     throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    //   }
    // });

    // Get registration by referenceId
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      relations: ['programFinancialServiceProviderConfiguration'],
    });
    if (
      registration.programFinancialServiceProviderConfigurationId ===
      newFspConfig.id
    ) {
      const errors = `New FSP config id is the same as existing FSP config id for this Person Affected.`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    // Get old registration to log
    const oldViewRegistration =
      await this.getPaginateRegistrationForReferenceId(
        referenceId,
        registration.programId,
      );

    // Update FSP
    const updatedRegistration = await this.addFsp(referenceId, newFspConfig.id);
    if (process.env.SYNC_WITH_THIRD_PARTIES) {
      await this.sendContactInformationToIntersolve(updatedRegistration);
    }

    const newViewRegistration =
      await this.getPaginateRegistrationForReferenceId(
        referenceId,
        registration.programId,
      );
    // Log change
    await this.eventsService.log(oldViewRegistration, newViewRegistration, {
      additionalLogAttributes: { reason: 'Financial service provider change' },
    });

    return newViewRegistration;
  }

  public async validateAttribute(
    referenceId: string,
    attributeName: string,
    value: any,
    userId: number,
  ): Promise<void> {
    if (attributeName === 'referenceId') {
      const errors = `Cannot update referenceId`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    const attributeDto: UpdateAttributeDto = {
      referenceId,
      attribute: attributeName,
      value,
      userId,
    };
    const errors = await validate(
      plainToClass(UpdateAttributeDto, attributeDto),
    );
    if (errors.length > 0) {
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async getMessageHistoryRegistration(
    referenceId: string,
  ): Promise<MessageHistoryDto[]> {
    const messageHistoryArray = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select([
        'twilioMessage.dateCreated as created',
        'twilioMessage.from as from',
        'twilioMessage.to as to',
        'twilioMessage.body as body',
        'twilioMessage.status as status',
        'twilioMessage.type as type',
        'twilioMessage.mediaUrl as "mediaUrl"',
        'twilioMessage.contentType as "contentType"',
        'twilioMessage.errorCode as "errorCode"',
        'user.id as "userId"',
        'user.username as "username"',
      ])
      .leftJoin('registration.twilioMessages', 'twilioMessage')
      .leftJoin('twilioMessage.user', 'user')
      .andWhere('registration.referenceId = :referenceId', {
        referenceId,
      })
      .orderBy('twilioMessage.dateCreated', 'DESC')
      .getRawMany();

    if (
      messageHistoryArray.length === 1 &&
      messageHistoryArray[0].created === null
    ) {
      return [];
    }

    const result = messageHistoryArray.map((row) => {
      const { userId, username, ...rest } = row;
      return {
        ...rest,
        user: {
          id: userId,
          username,
        },
      };
    });

    return result;
  }

  public async getReferenceId(
    programId: number,
    paId: number,
  ): Promise<RegistrationEntity | null> {
    return await this.registrationScopedRepository.findOne({
      where: {
        programId: Equal(programId),
        registrationProgramId: Equal(paId),
      },
    });
  }

  public async retrieveAndUpdateIntersolveVisaWalletAndCards(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    const registration = await this.getRegistrationOrThrow({
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
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      relations: [],
      programId,
    });
    return await this.intersolveVisaService.getWalletWithCards(registration.id);
  }

  /**
   * This function reissues a visa card and sends a message.
   * - It first retrieves the registration associated with the given reference ID and program ID and he Intersolve Visa configuration for the program.
   * - It than checks that all required data fields are present in the registration data.
   * - It then calls the Intersolve Visa service to reissue the card with the registration data and Intersolve Visa configuration.
   * - Finally, it adds a message to the queue to be sent to the registrant.
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
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      programId,
      relations: ['programFinancialServiceProviderConfiguration'],
    });
    if (
      !registration.programFinancialServiceProviderConfigurationId ||
      registration.programFinancialServiceProviderConfiguration
        ?.financialServiceProviderName !==
        FinancialServiceProviders.intersolveVisa
    ) {
      throw new HttpException(
        `This registration is not associated with the Intersolve Visa financial service provider.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const intersolveVisaConfig =
      await this.programFinancialServiceProviderConfigurationRepository.getPropertyValuesByNamesOrThrow(
        {
          programFinancialServiceProviderConfigurationId:
            registration.programFinancialServiceProviderConfigurationId,
          names: [
            FinancialServiceProviderConfigurationProperties.brandCode,
            FinancialServiceProviderConfigurationProperties.coverLetterCode,
          ],
        },
      );

    //  TODO: REFACTOR: This 'ugly' code is now also in payments.service.createAndAddIntersolveVisaTransactionJobs. This should be refactored when there's a better way of getting registration data.
    const intersolveVisaAttributes = findFinancialServiceProviderByNameOrFail(
      FinancialServiceProviders.intersolveVisa,
    ).attributes;

    const intersolveVisaAttributeNames = intersolveVisaAttributes.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      'fullName',
      'phoneNumber',
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
      if (name === 'addressHouseNumberAddition') continue; // Skip non-required property
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
    await this.sendContactInformationToIntersolve(registration);

    try {
      await this.intersolveVisaService.reissueCard({
        registrationId: registration.id,
        // Why do we need this?
        reference: registration.referenceId,
        name: mappedRegistrationData['fullName'],
        contactInformation: {
          addressStreet: mappedRegistrationData['addressStreet'],
          addressHouseNumber: mappedRegistrationData['addressHouseNumber'],
          addressHouseNumberAddition:
            mappedRegistrationData['addressHouseNumberAddition'],
          addressPostalCode: mappedRegistrationData['addressPostalCode'],
          addressCity: mappedRegistrationData['addressCity'],
          phoneNumber: mappedRegistrationData['phoneNumber'], // In the above for loop it is checked that this is not undefined or empty
        },
        brandCode: intersolveVisaConfig.find(
          (c) =>
            c.name ===
            FinancialServiceProviderConfigurationProperties.brandCode,
        )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
        coverLetterCode: intersolveVisaConfig.find(
          (c) =>
            c.name ===
            FinancialServiceProviderConfigurationProperties.coverLetterCode,
        )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
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

  /**
   * Pauses or unpauses a card associated with a given token code and sends a message to the registrant.
   * - It retrieves the registration, pauses or unpauses the card, sends a message to the registrant, and returns the updated wallet.
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
    const registration = await this.getRegistrationOrThrow({
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
    const registration = await this.getRegistrationOrThrow({
      referenceId,
      programId,
    });
    await this.sendContactInformationToIntersolve(registration);
  }
}
