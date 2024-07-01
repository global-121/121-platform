import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventsService } from '@121-service/src/events/events.service';
import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  ImportRegistrationsDto,
  ImportResult,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { CreateRegistrationDto } from '@121-service/src/registration/dto/create-registration.dto';
import { CustomDataDto } from '@121-service/src/registration/dto/custom-data.dto';
import { MessageHistoryDto } from '@121-service/src/registration/dto/message-history.dto';
import { ReferenceProgramIdScopeDto } from '@121-service/src/registration/dto/registrationProgramIdScope.dto';
import {
  AdditionalAttributes,
  Attributes,
  UpdateAttributeDto,
  UpdateRegistrationDto,
} from '@121-service/src/registration/dto/update-registration.dto';
import {
  AnswerTypes,
  CustomDataAttributes,
} from '@121-service/src/registration/enum/custom-data-attributes';
import {
  RegistrationStatusEnum,
  RegistrationStatusTimestampField,
} from '@121-service/src/registration/enum/registration-status.enum';
import { ErrorEnum } from '@121-service/src/registration/errors/registration-data.error';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserService } from '@121-service/src/user/user.service';
import { convertToScopedOptions } from '@121-service/src/utils/scope/createFindWhereOptions.helper';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Equal, Repository } from 'typeorm';

import { FinancialServiceProviderQuestionRepository } from '@121-service/src/financial-service-providers/repositories/financial-service-provider-question.repository';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { ContactInformationDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/external/contact-information.dto';
import { IntersolveVisaParentWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-visa-parent-wallet.dto';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';

@Injectable()
export class RegistrationsService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspAttributeRepository: Repository<FspQuestionEntity>;
  // Even though this is related to the registration entity, it is not scoped since we never get/update this in a direct call
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;

  public constructor(
    private readonly lookupService: LookupService,
    private readonly queueMessageService: QueueMessageService,
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
    @Inject(getScopedRepositoryProviderName(TwilioMessageEntity))
    private twilioMessageScopedRepository: ScopedRepository<TwilioMessageEntity>,
    @Inject(getScopedRepositoryProviderName(EventEntity))
    private eventScopedRepository: ScopedRepository<EventEntity>,
    private readonly financialServiceProviderQuestionRepository: FinancialServiceProviderQuestionRepository,
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
      .andWhere({ referenceId: referenceId });
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
      { referenceId: referenceId },
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

  public async getRegistrationFromReferenceId(
    referenceId: string,
    relations: string[] = [],
    programId?: number,
  ): Promise<RegistrationEntity> {
    if (!referenceId) {
      const errors = `ReferenceId is not set`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const registration =
      await this.registrationScopedRepository.getWithRelationsByReferenceId({
        referenceId,
        relations,
      });
    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known (within your scope).`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    } else if (programId && registration.programId !== Number(programId)) {
      const errors = `ReferenceId ${referenceId} is not known for program ${programId}.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return registration;
  }

  public async addFsp(
    referenceId: string,
    fspId: number,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    const fsp = await this.fspRepository.findOneOrFail({
      where: { id: Equal(fspId) },
      relations: ['questions'],
    });
    registration.fsp = fsp;
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
    const registration = await this.getRegistrationFromReferenceId(referenceId);
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
    const fspAttributesTypeTel = await this.fspAttributeRepository.find({
      where: { answerType: Equal(AnswerTypes.tel) },
    });
    for (const fspAttr of fspAttributesTypeTel) {
      answersTypeTel.push(fspAttr.name);
    }
    const programQuestionsTypeTel = await this.programQuestionRepository.find({
      where: { answerType: Equal(AnswerTypes.tel) },
    });
    for (const question of programQuestionsTypeTel) {
      answersTypeTel.push(question.name);
    }

    if (!answersTypeTel.includes(customDataKey)) {
      return customDataValue;
    }

    if (
      !allowEmptyPhoneNumber &&
      customDataKey === CustomDataAttributes.phoneNumber
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
  ): Promise<void> {
    return await this.registrationsImportService.patchBulk(
      csvFile,
      programId,
      userId,
    );
  }

  public async importValidatedRegistrations(
    validatedImportRecords: ImportRegistrationsDto[],
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    if (!program?.published) {
      const errors =
        'Registrations are not allowed for this program yet, try again later.';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    return await this.registrationsImportService.importValidatedRegistrations(
      validatedImportRecords,
      program,
      userId,
    );
  }

  public async importJsonValidateRegistrations(
    validatedJsonData: ImportRegistrationsDto[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    return await this.registrationsImportService.validateImportAsRegisteredInput(
      validatedJsonData,
      programId,
      userId,
    );
  }

  private async findProgramOrThrow(programId: number): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations: ['programCustomAttributes'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public transformRegistrationByNamingConvention(
    nameColumns: string[],
    registrationObject: object,
  ): object {
    const fullnameConcat: string[] = [];
    for (const nameColumn of nameColumns) {
      fullnameConcat.push(registrationObject[nameColumn]);
      delete registrationObject[nameColumn];
    }
    registrationObject['name'] = fullnameConcat.join(' ');
    return registrationObject;
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

    let registrationToUpdate = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program', 'fsp'],
      programId,
    );
    const oldViewRegistration =
      await this.getPaginateRegistrationForReferenceId(referenceId, programId);

    for (const attributeKey of Object.keys(partialRegistration)) {
      const attributeValue = partialRegistration[attributeKey];

      const oldValue = oldViewRegistration[attributeKey];

      if (String(oldValue) !== String(attributeValue)) {
        registrationToUpdate = await this.updateAttribute(
          attributeKey,
          attributeValue,
          registrationToUpdate,
        );
        nrAttributesUpdated++;
      }
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
      return this.getRegistrationFromReferenceId(
        calculatedRegistration.referenceId,
      );
    }

    if (process.env.SYNC_WITH_THIRD_PARTIES) {
      await this.sendContactInformationToIntersolve(registration);
    }

    return this.getRegistrationFromReferenceId(savedRegistration.referenceId, [
      'program',
    ]);
  }

  private async sendContactInformationToIntersolve(
    registration: RegistrationEntity,
  ): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (registrationHasVisaCustomer) {
      // TODO: REFACTOR: Find a way to not have the data fields hardcoded in this function.
      type ContactInformationKeys = keyof ContactInformationDto;
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
      CustomDataAttributes.phoneNumber as string,
      CustomDataAttributes.whatsappPhoneNumber as string,
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
        phoneNumber: phoneNumber,
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

  public async updateChosenFsp({
    referenceId,
    newFspName,
    newFspAttributesRaw = {},
    userId,
  }: {
    referenceId: string;
    newFspName: FinancialServiceProviderName;
    newFspAttributesRaw?: Record<string, any>;
    userId: number;
  }) {
    //Identify new FSP
    const newFsp = await this.fspRepository.findOne({
      where: { fsp: Equal(newFspName) },
      relations: ['questions'],
    });
    if (!newFsp) {
      const errors = `FSP with this name not found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // Check if required attributes are present
    newFsp.questions.forEach((requiredAttribute) => {
      if (!Object.keys(newFspAttributesRaw).includes(requiredAttribute.name)) {
        const requiredAttributes = newFsp.questions
          .map((a) => a.name)
          .join(', ');
        const errors = `Not all required FSP attributes provided correctly: ${requiredAttributes}`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    });

    // Get registration by referenceId
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['fsp', 'fsp.questions'],
    );
    if (registration.fsp?.id === newFsp.id) {
      const errors = `New FSP is the same as existing FSP for this Person Affected.`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    // Check if potential phonenumbers are correct and clean them
    const newFspAttributes = {};
    for (const [key, value] of Object.entries(newFspAttributesRaw)) {
      newFspAttributes[key] = await this.cleanCustomDataIfPhoneNr(
        key,
        value,
        registration.programId,
      );
    }

    // Get old registration to log
    const oldViewRegistration =
      await this.getPaginateRegistrationForReferenceId(
        referenceId,
        registration.programId,
      );

    // Remove old attributes
    const oldFsp = registration.fsp;
    for (const attribute of oldFsp?.questions) {
      const regData =
        await this.registrationDataService.getRegistrationDataByName(
          registration,
          attribute.name,
        );
      await this.registrationDataScopedRepository.deleteUnscoped({
        id: regData?.id,
      });
    }

    // Update FSP
    const updatedRegistration = await this.addFsp(referenceId, newFsp.id);

    // Add new attributes
    for (const attribute of updatedRegistration.fsp.questions) {
      await this.validateAttribute(
        referenceId,
        attribute.name,
        newFspAttributes[attribute.name],
        userId,
      );
      await this.addRegistrationData(
        referenceId,
        attribute.name,
        newFspAttributes[attribute.name],
      );
    }
    await this.registrationUtilsService.save(updatedRegistration);

    const newViewRegistration =
      await this.getPaginateRegistrationForReferenceId(
        referenceId,
        registration.programId,
      );

    if (process.env.SYNC_WITH_THIRD_PARTIES) {
      await this.sendContactInformationToIntersolve(updatedRegistration);
    }

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
    const attributeDto: UpdateAttributeDto = {
      referenceId,
      attribute: attributeName,
      value,
      userId: userId,
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
      ])
      .leftJoin('registration.twilioMessages', 'twilioMessage')
      .andWhere('registration.referenceId = :referenceId', {
        referenceId: referenceId,
      })
      .orderBy('twilioMessage.dateCreated', 'DESC')
      .getRawMany();

    if (
      messageHistoryArray.length === 1 &&
      messageHistoryArray[0].created === null
    ) {
      return [];
    }
    return messageHistoryArray;
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

  public async getUpdateVisaParentWalletDto(
    referenceId: string,
    programId: number,
  ): Promise<IntersolveVisaParentWalletDto> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      [],
      programId,
    );
    return await this.intersolveVisaService.getUpdateParentWalletDto(
      registration.id,
      referenceId,
      programId,
    );
  }

  public async reissueCardAndSendMessage(
    referenceId: string,
    programId: number,
  ) {
    const registration =
      await this.registrationScopedRepository.getByReferenceIdAndProgramId({
        referenceId,
        programId,
      });
    if (!registration) {
      throw new HttpException(
        `Registration not found for referenceId: ${referenceId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    const intersolveVisaConfig =
      await this.programFinancialServiceProviderConfigurationRepository.getValuesByNamesOrThrow(
        {
          programId: programId,
          financialServiceProviderName:
            FinancialServiceProviderName.intersolveVisa,
          names: [
            FinancialServiceProviderConfigurationEnum.brandCode,
            FinancialServiceProviderConfigurationEnum.coverLetterCode,
          ],
        },
      );

    //  TODO: REFACTOR: This 'ugly' code is now also in payments.service.createAndAddIntersolveVisaTransactionJobs. This should be refactored when there's a better way of getting registration data.
    const intersolveVisaQuestions =
      await this.financialServiceProviderQuestionRepository.getQuestionsByFspName(
        FinancialServiceProviderName.intersolveVisa,
      );
    const intersolveVisaQuestionNames = intersolveVisaQuestions.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      'fullName',
      'phoneNumber',
      ...intersolveVisaQuestionNames,
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

    // // TODO: Test with debugger to see empty properties
    // // Check if all required properties are present. If not, create a failed transaction and throw an error.
    for (const key in registrationData) {
      if (key === 'addressHouseNumberAddition') continue; // Skip non-required property

      // Define "empty" based on your needs. Here, we check for null, undefined, or an empty string.
      if (
        registrationData[key] === null ||
        registrationData[key] === undefined ||
        // TODO: Is this .value check what we want?
        registrationData[key].value === ''
      ) {
        const errorText = `Property ${key} is undefined`;
        throw new HttpException(errorText, HttpStatus.BAD_REQUEST);
      }
    }

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
        (c) => c.name === FinancialServiceProviderConfigurationEnum.brandCode,
      )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
      coverLetterCode: intersolveVisaConfig.find(
        (c) =>
          c.name === FinancialServiceProviderConfigurationEnum.coverLetterCode,
      )?.value as string, // This must be a string. If it is not, the intersolve API will return an error (maybe).
    });

    await this.queueMessageService.addMessageToQueue({
      registration: registration,
      messageTemplateKey: ProgramNotificationEnum.reissueVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    });
  }

  public async pauseCardAndSendMessage(
    referenceId: string,
    programId: number,
    tokenCode: string,
    pause: boolean,
  ): Promise<IntersolveVisaChildWalletEntity> {
    const registration =
      await this.registrationScopedRepository.getByReferenceIdAndProgramId({
        referenceId,
        programId,
      });
    if (!registration) {
      throw new HttpException(
        `Registration not found for referenceId: ${referenceId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    const updatedWallet = await this.intersolveVisaService.pauseCardOrThrow(
      tokenCode,
      pause,
    );
    await this.queueMessageService.addMessageToQueue({
      registration: registration,
      messageTemplateKey: pause
        ? ProgramNotificationEnum.pauseVisaCard
        : ProgramNotificationEnum.unpauseVisaCard,
      messageContentType: MessageContentType.custom,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    });
    return updatedWallet;
  }

  public async getRegistrationAndSendContactInformationToIntersolve(
    referenceId: string,
    programId: number,
  ): Promise<void> {
    const registration =
      await this.registrationScopedRepository.getByReferenceIdAndProgramId({
        referenceId,
        programId,
      });
    if (!registration) {
      throw new HttpException(
        `Registration not found for referenceId: ${referenceId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.sendContactInformationToIntersolve(registration);
  }
}
