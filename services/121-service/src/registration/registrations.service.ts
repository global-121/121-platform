import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { EventEntity } from '../events/entities/event.entity';
import { EventsService } from '../events/events.service';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { AnswerSet, FspAnswersAttrInterface } from '../fsp/fsp-interface';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { LastMessageStatusService } from '../notifications/last-message-status.service';
import { LookupService } from '../notifications/lookup/lookup.service';
import { QueueMessageService } from '../notifications/queue-message/queue-message.service';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { IntersolveVisaService } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ScopedRepository } from '../scoped.repository';
import { PermissionEnum } from '../user/enum/permission.enum';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { convertToScopedOptions } from '../utils/scope/createFindWhereOptions.helper';
import { getScopedRepositoryProviderName } from '../utils/scope/createScopedRepositoryProvider.helper';
import { FinancialServiceProviderEntity } from './../fsp/financial-service-provider.entity';
import { TryWhatsappEntity } from './../notifications/whatsapp/try-whatsapp.entity';
import { ImportRegistrationsDto, ImportResult } from './dto/bulk-import.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CustomDataDto } from './dto/custom-data.dto';
import { DownloadData } from './dto/download-data.interface';
import { MessageHistoryDto } from './dto/message-history.dto';
import { ReferenceProgramIdScopeDto } from './dto/registrationProgramIdScope.dto';
import { ProgramAnswer } from './dto/store-program-answers.dto';
import {
  AdditionalAttributes,
  Attributes,
  UpdateAttributeDto,
  UpdateRegistrationDto,
} from './dto/update-registration.dto';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import {
  AnswerTypes,
  CustomDataAttributes,
} from './enum/custom-data-attributes';
import {
  RegistrationStatusEnum,
  RegistrationStatusTimestampField,
} from './enum/registration-status.enum';
import { ErrorEnum } from './errors/registration-data.error';
import { RegistrationDataService } from './modules/registration-data/registration-data.service';
import { RegistrationUtilsService } from './modules/registration-utilts/registration-utils.service';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationViewEntity } from './registration-view.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationScopedRepository } from './repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from './repositories/registration-view-scoped.repository';
import { InclusionScoreService } from './services/inclusion-score.service';
import { RegistrationsImportService } from './services/registrations-import.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';

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
  ): Promise<RegistrationViewEntity> {
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
      where: { id: userId },
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
    registration.program = await this.programRepository.findOneBy({
      id: programId,
    });
    await this.registrationUtilsService.save(registration);
    return this.setRegistrationStatus(
      postData.referenceId,
      RegistrationStatusEnum.startedRegistration,
    );
  }

  private async setRegistrationStatus(
    referenceId: string,
    status: RegistrationStatusEnum,
  ): Promise<RegistrationViewEntity> {
    const registrationBeforeUpdate =
      await this.registrationViewScopedRepository.findOne({
        where: { referenceId: referenceId },
        select: ['id', 'status'],
      });
    await this.registrationScopedRepository.updateUnscoped(
      { referenceId: referenceId },
      { registrationStatus: status },
    );
    const registrationAfterUpdate =
      await this.registrationViewScopedRepository.findOne({
        where: { referenceId: referenceId },
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
      case RegistrationStatusEnum.startedRegistration:
        result = [null].includes(currentStatus);
        break;
      case RegistrationStatusEnum.registered:
        result = [RegistrationStatusEnum.startedRegistration, null].includes(
          currentStatus,
        );
        break;
      case RegistrationStatusEnum.validated:
        result = [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.declined,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.declined:
        result = [RegistrationStatusEnum.registered].includes(currentStatus);
        break;
      case RegistrationStatusEnum.included:
        result = [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.validated,
          RegistrationStatusEnum.rejected,
          RegistrationStatusEnum.inclusionEnded,
          RegistrationStatusEnum.paused,
          RegistrationStatusEnum.completed,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.inclusionEnded:
        result = [
          RegistrationStatusEnum.paused,
          RegistrationStatusEnum.included,
          RegistrationStatusEnum.completed,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.rejected:
        result = [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.validated,
          RegistrationStatusEnum.included,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.deleted:
        result = [
          RegistrationStatusEnum.startedRegistration,
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.validated,
          RegistrationStatusEnum.rejected,
          RegistrationStatusEnum.inclusionEnded,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.completed:
        result = [RegistrationStatusEnum.included].includes(currentStatus);
        break;
      case RegistrationStatusEnum.paused:
        result = [RegistrationStatusEnum.included].includes(currentStatus);
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
      where: { referenceId: referenceId },
      relations: relations,
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

  public async storeProgramAnswers(
    referenceId: string,
    rawProgramAnswers: ProgramAnswer[],
    programId: number,
  ): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program'],
    );
    const programAnswers = await this.cleanAnswers(
      rawProgramAnswers,
      programId,
    );
    for (const answer of programAnswers) {
      const programQuestion = await this.programQuestionRepository.findOne({
        where: { name: answer.programQuestionName },
      });
      if (programQuestion) {
        const data = {};
        data[answer.programQuestionName] = answer.programAnswer;
        await this.updateRegistration(programId, referenceId, {
          data,
          reason: 'Changed from field validation app.',
        });
      }
    }
    await this.storePhoneNumberInRegistration(programAnswers, referenceId);
    await this.inclusionScoreService.calculateInclusionScore(referenceId);
    await this.inclusionScoreService.calculatePaymentAmountMultiplier(
      registration.program,
      referenceId,
    );
  }

  public async cleanAnswers(
    programAnswers: ProgramAnswer[],
    programId: number,
  ): Promise<ProgramAnswer[]> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['programQuestions'],
    });
    const phonenumberTypedAnswers = [];
    for (const programQuestion of program.programQuestions) {
      if (programQuestion.answerType == AnswerTypes.tel) {
        phonenumberTypedAnswers.push(programQuestion.name);
      }
    }

    const cleanedAnswers = [];
    for (const programAnswer of programAnswers) {
      if (
        typeof programAnswer.programAnswer === 'string' &&
        phonenumberTypedAnswers.includes(programAnswer.programQuestionName)
      ) {
        programAnswer.programAnswer = await this.lookupService.lookupAndCorrect(
          programAnswer.programAnswer,
        );
      }
      cleanedAnswers.push(programAnswer);
    }
    return cleanedAnswers;
  }

  public async storePhoneNumberInRegistration(
    programAnswers: ProgramAnswer[],
    referenceId: string,
  ): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program'],
    );
    const phoneAnswer = programAnswers.find(
      (answer) =>
        answer.programQuestionName === CustomDataAttributes.phoneNumber,
    );
    if (phoneAnswer && typeof phoneAnswer.programAnswer === 'string') {
      registration.phoneNumber = phoneAnswer.programAnswer;
      await this.registrationUtilsService.save(registration);
    }
  }

  public async addFsp(
    referenceId: string,
    fspId: number,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    const fsp = await this.fspRepository.findOne({
      where: { id: fspId },
      relations: ['questions'],
    });
    registration.fsp = fsp;
    return await this.registrationUtilsService.save(registration);
  }

  public async addRegistrationDataBulk(
    dataArray: CustomDataDto[],
  ): Promise<RegistrationEntity[]> {
    const registrations = [];
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
  ): Promise<string | number | string[]> {
    const allowEmptyPhoneNumber = (
      await this.programRepository.findOneBy({
        id: programId,
      })
    )?.allowEmptyPhoneNumber;

    const answersTypeTel = [];
    const fspAttributesTypeTel = await this.fspAttributeRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (const fspAttr of fspAttributesTypeTel) {
      answersTypeTel.push(fspAttr.name);
    }
    const programQuestionsTypeTel = await this.programQuestionRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (const question of programQuestionsTypeTel) {
      answersTypeTel.push(question.name);
    }
    if (answersTypeTel.includes(customDataKey)) {
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
        return await this.lookupService.lookupAndCorrect(
          String(customDataValue),
        );
      } else {
        if (!customDataValue) {
          // other tel-types (e.g. whatsappPhoneNumber) can be empty
          return customDataValue;
        }
        // otherwise check
        return await this.lookupService.lookupAndCorrect(
          String(customDataValue),
        );
      }
    } else {
      return customDataValue;
    }
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
      where: { id: programId },
      relations: ['programCustomAttributes'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public getName(registrationRow: object, program: ProgramEntity): string {
    const fullnameConcat = [];
    const nameColumns = JSON.parse(
      JSON.stringify(program.fullnameNamingConvention),
    );
    for (const nameColumn of nameColumns) {
      fullnameConcat.push(registrationRow[nameColumn]);
    }
    return fullnameConcat.join(' ');
  }

  public transformRegistrationByNamingConvention(
    nameColumns: string[],
    registrationObject: object,
  ): object {
    const fullnameConcat = [];
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
      case RegistrationStatusEnum.startedRegistration:
        return RegistrationStatusTimestampField.startedRegistrationDate;
      case RegistrationStatusEnum.registered:
        return RegistrationStatusTimestampField.registeredDate;
      case RegistrationStatusEnum.validated:
        return RegistrationStatusTimestampField.validationDate;
      case RegistrationStatusEnum.included:
        return RegistrationStatusTimestampField.inclusionDate;
      case RegistrationStatusEnum.inclusionEnded:
        return RegistrationStatusTimestampField.inclusionEndDate;
      case RegistrationStatusEnum.rejected:
        return RegistrationStatusTimestampField.rejectionDate;
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
  ): Promise<RegistrationViewEntity> {
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

  public async searchRegistration(
    rawPhoneNumber: string,
    userId: number,
  ): Promise<RegistrationViewEntity[]> {
    const registrations = [];

    if (rawPhoneNumber) {
      const customAttributesPhoneNumberNames = [
        CustomDataAttributes.phoneNumber as string,
        CustomDataAttributes.whatsappPhoneNumber as string,
      ];

      const phoneNumber = await this.lookupService.lookupAndCorrect(
        rawPhoneNumber,
        true,
      );
      if (!phoneNumber) {
        return registrations;
      }

      const matchingRegistrations = (
        await this.registrationScopedRepository.find({
          where: { phoneNumber: phoneNumber },
        })
      ).map((r) => {
        return {
          programId: r.programId,
          referenceId: r.referenceId,
          scope: r.scope,
        };
      });
      const matchingRegistrationData =
        await this.registrationDataScopedRepository
          .createQueryBuilder('registrationData')
          .leftJoinAndSelect('registrationData.registration', 'registration')
          .andWhere('registrationData.value = :phoneNumber', {
            phoneNumber: phoneNumber,
          })
          .getMany();

      for (const d of matchingRegistrationData) {
        const dataName = await d.getDataName();
        if (customAttributesPhoneNumberNames.includes(dataName)) {
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

      const filteredRegistrations =
        await this.filterRegistrationsByProgramScope(
          uniqueRegistrations,
          userId,
        );

      for (const uniqueRegistration of filteredRegistrations) {
        const registration = await this.getPaginateRegistrationForReferenceId(
          uniqueRegistration.referenceId,
          uniqueRegistration.programId,
        );
        registrations.push(registration);
      }
    }
    return registrations;
  }

  private async filterRegistrationsByProgramScope(
    registrationObjects: ReferenceProgramIdScopeDto[],
    userId: number,
  ): Promise<RegistrationEntity[]> {
    const filteredRegistrations = [];
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
            programId: registration.programId,
            referenceId: registration.referenceId,
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

  public async checkPermissionAndThrow(
    userId: number,
    permission: PermissionEnum,
    programId: number,
  ): Promise<void> {
    const programIds = (
      await this.userService.getProgramScopeIdsUserHasPermission(
        userId,
        permission,
      )
    ).map((p) => p.programId);
    if (!programIds.includes(programId)) {
      const error = `User does not have the ${permission} permission for this program`;
      throw new HttpException({ error }, HttpStatus.UNAUTHORIZED);
    }
  }

  // AW: get answers to attributes for a given PA (identified first through referenceId)
  public async getRegistrationToValidate(
    referenceId: string,
    userId: number,
  ): Promise<RegistrationEntity> {
    await this.userService.findUserProgramAssignmentsOrThrow(userId);
    let registration = await this.getRegistrationFromReferenceId(referenceId, [
      'program',
      'program.programQuestions',
      'data',
      'data.programQuestion',
      'data.fspQuestion',
    ]);

    const registrationsScoped = await this.filterRegistrationsByProgramScope(
      [registration],
      userId,
    );
    if (registrationsScoped.length !== 1) {
      return null;
    }

    registration = registrationsScoped[0];

    const programAnswers = [];
    for (const d of registration.data) {
      if (d.programQuestionId) {
        d['name'] = await d.getDataName();
        if (d.programQuestion.answerType === AnswerTypes.multiSelect) {
          const existingQuestion = programAnswers.find(
            (a) => a.programQuestionId === d.programQuestionId,
          );
          if (!existingQuestion) {
            programAnswers.push(d);
            programAnswers.find(
              (a) => a.programQuestionId === d.programQuestionId,
            ).value = [d.value];
          } else {
            existingQuestion.value.push(d.value);
          }
        } else {
          programAnswers.push(d);
        }
      }
    }
    registration['data'] = null;
    registration['programAnswers'] = programAnswers;
    return registration;
  }

  public async updateChosenFsp(
    referenceId: string,
    newFspName: FspName,
    newFspAttributesRaw: object,
    userId: number,
  ): Promise<RegistrationViewEntity> {
    //Identify new FSP
    const newFsp = await this.fspRepository.findOne({
      where: { fsp: newFspName },
      relations: ['questions'],
    });
    if (!newFsp) {
      const errors = `FSP with this name not found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // Check if required attributes are present
    newFsp.questions.forEach((requiredAttribute) => {
      if (
        !newFspAttributesRaw ||
        !Object.keys(newFspAttributesRaw).includes(requiredAttribute.name)
      ) {
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
        id: regData.id,
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

  public async downloadValidationData(userId: number): Promise<DownloadData> {
    const user =
      await this.userService.findUserProgramAssignmentsOrThrow(userId);
    const data = {
      answers: await this.getAllProgramAnswers(user.id),
      fspData: await this.getAllFspAnswers(user.id),
      programIds: user.programAssignments.map((assignment) => {
        return assignment.program.id;
      }),
    };
    return data;
  }

  public async getAllProgramAnswers(
    userId: number,
  ): Promise<RegistrationDataEntity[]> {
    const registrationsToValidate = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .addSelect([
        '"referenceId"',
        'registration."programId" AS "programId"',
        'scope',
      ])
      .leftJoinAndSelect('registration.program', 'program')
      .leftJoinAndSelect('registration.data', 'data')
      .leftJoinAndSelect('data.programQuestion', 'programQuestion')
      .andWhere('"registrationStatus" IN (:...registrationStatuses)', {
        registrationStatuses: [RegistrationStatusEnum.registered],
      })
      .andWhere('data.programQuestionId is not null')
      .getMany();

    const filteredRegistrations = await this.filterRegistrationsByProgramScope(
      registrationsToValidate,
      userId,
    );

    let answers = [];
    for (const r of filteredRegistrations) {
      const uniqueQuestions = [];
      for (const a of r.data) {
        a['referenceId'] = r.referenceId;
        a['programId'] = r.program.id;
        a['name'] = await a.getDataName();
        if (a.programQuestion.answerType === AnswerTypes.multiSelect) {
          const existingQuestion = uniqueQuestions.find(
            (q) => q.programQuestionId === a.programQuestionId,
          );
          if (!existingQuestion) {
            uniqueQuestions.push(a);
            uniqueQuestions.find(
              (q) => q.programQuestionId === a.programQuestionId,
            ).value = [a.value];
          } else {
            existingQuestion.value.push(a.value);
          }
        } else {
          uniqueQuestions.push(a);
        }
      }
      answers = [...answers, ...uniqueQuestions];
    }
    return answers;
  }

  public async getAllFspAnswers(
    userId: number,
  ): Promise<FspAnswersAttrInterface[]> {
    const registrations = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .addSelect([
        '"referenceId"',
        'registration."programId" AS "programId"',
        'scope',
      ])
      .leftJoinAndSelect('registration.fsp', 'fsp')
      .leftJoinAndSelect('fsp.questions', ' fsp_question.fsp')
      .leftJoin('registration.program', 'program')
      .andWhere('registration.fsp IS NOT NULL')
      .andWhere('"registrationStatus" IN (:...registrationStatuses)', {
        registrationStatuses: [RegistrationStatusEnum.registered],
      })
      .getMany();

    const filteredRegistrations = await this.filterRegistrationsByProgramScope(
      registrations,
      userId,
    );

    const fspDataPerRegistration = [];
    for (const registration of filteredRegistrations) {
      const answers = await this.getFspAnswers(registration.referenceId);
      const fspData = {
        attributes: registration.fsp.questions,
        answers: answers,
        referenceId: registration.referenceId,
      };
      fspDataPerRegistration.push(fspData);
    }
    return fspDataPerRegistration;
  }

  public async getFspAnswers(referenceId: string): Promise<AnswerSet> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      [
        'program',
        'program.programQuestions',
        'data',
        'data.programQuestion',
        'data.fspQuestion',
      ],
    );
    const fspAnswers = {};
    for (const d of registration.data) {
      if (d.fspQuestionId) {
        const code = await d.getDataName();
        if (d.fspQuestion.answerType === AnswerTypes.multiSelect) {
          if (!fspAnswers[code]) {
            const answer = {
              code: code,
              value: [d.value],
              label: d.fspQuestion.label['en'],
            };
            fspAnswers[code] = answer;
          } else {
            fspAnswers[code].value.push(d.value);
          }
        } else {
          const answer = {
            code: code,
            value: d.value,
            label: d.fspQuestion.label['en'],
          };
          fspAnswers[code] = answer;
        }
      }
    }
    return fspAnswers;
  }

  public async getFspAnswersAttributes(
    referenceId: string,
  ): Promise<FspAnswersAttrInterface> {
    const qb = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.fsp', 'fsp')
      .leftJoinAndSelect('fsp.questions', ' fsp_attribute.fsp')
      .andWhere('registration.referenceId = :referenceId', {
        referenceId: referenceId,
      });
    const registration = await qb.getOne();
    const fspAnswers = await this.getFspAnswers(registration.referenceId);
    return {
      attributes: registration.fsp.questions,
      answers: fspAnswers,
      referenceId: referenceId,
    };
  }

  // Used by Aidworker
  public async issueValidation(
    payload: ValidationIssueDataDto,
    programId: number,
  ): Promise<void> {
    await this.storeProgramAnswers(
      payload.referenceId,
      payload.programAnswers,
      programId,
    );
    await this.setRegistrationStatus(
      payload.referenceId,
      RegistrationStatusEnum.validated,
    );
    // Removing non-persistent answers is done after storing the answers because storing the answers also calculate the inclusion store
    await this.removeNonPersistentProgramAnswers(payload.referenceId);
  }

  private async removeNonPersistentProgramAnswers(referenceId): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['data', 'data.programQuestion'],
    );
    for (const data of registration.data) {
      if (data.programQuestion && data.programQuestion.persistence === false) {
        await this.registrationDataScopedRepository.remove(data);
      }
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

  public async getRegistrationStatus(
    referenceId: string,
  ): Promise<RegistrationStatusEnum> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    return registration.registrationStatus;
  }

  public async getReferenceId(
    programId: number,
    paId: number,
  ): Promise<RegistrationEntity> {
    return await this.registrationScopedRepository.findOne({
      where: { programId: programId, registrationProgramId: paId },
    });
  }
}
