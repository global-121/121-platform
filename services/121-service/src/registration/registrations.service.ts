import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Equal, Repository } from 'typeorm';

import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventsService } from '@121-service/src/events/events.service';
import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { LastMessageStatusService } from '@121-service/src/notifications/last-message-status.service';
import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
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
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
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
    private readonly lastMessageStatusService: LastMessageStatusService,
    private readonly userService: UserService,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly eventsService: EventsService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(TwilioMessageEntity))
    private twilioMessageScopedRepository: ScopedRepository<TwilioMessageEntity>,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
    @Inject(getScopedRepositoryProviderName(EventEntity))
    private eventScopedRepository: ScopedRepository<EventEntity>,
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

  public async getRegistrationFromReferenceId(
    referenceId: string,
    relations: string[] = [],
    programId?: number,
  ): Promise<RegistrationEntity> {
    if (!referenceId) {
      const errors = `ReferenceId is not set`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: Equal(referenceId) },
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
    registrationObject: Record<string, any>, // Allow dynamic key access
  ): Record<string, any> {
    const fullnameConcat: string[] = [];

    // Loop through nameColumns and access properties dynamically
    for (const nameColumn of nameColumns) {
      if (registrationObject[nameColumn]) {
        fullnameConcat.push(registrationObject[nameColumn]);
        delete registrationObject[nameColumn]; // Remove original properties
      }
    }

    // Concatenate the full name and assign to the 'name' property
    registrationObject['name'] = fullnameConcat.join(' ');

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

    let registrationToUpdate = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program', 'fsp'],
      programId,
    );
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
      return this.getRegistrationFromReferenceId(
        calculatedRegistration.referenceId,
      );
    }

    if (process.env.SYNC_WITH_THIRD_PARTIES) {
      await this.syncUpdatesWithThirdParties(registration, [attribute]);
    }

    return this.getRegistrationFromReferenceId(savedRegistration.referenceId, [
      'program',
    ]);
  }

  private async syncUpdatesWithThirdParties(
    registration: RegistrationEntity,
    attributes: Attributes[] | string[],
  ): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (registrationHasVisaCustomer) {
      try {
        await this.intersolveVisaService.syncIntersolveCustomerWith121(
          registration.referenceId,
          registration.programId,
          attributes,
        );
      } catch (error) {
        if (error?.response?.errors?.length > 0) {
          const errors = `ERROR SYNCING TO INTERSOLVE: ${error.response.errors.join(
            ' ',
          )} The update in 121 did succeed.`;
          throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
        } else {
          throw error;
        }
      }
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
      await this.syncUpdatesWithThirdParties(
        updatedRegistration,
        Object.keys(newFspAttributes),
      );
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
}
