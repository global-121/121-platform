import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { In, Repository } from 'typeorm';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { AnswerSet, FspAnswersAttrInterface } from '../fsp/fsp-interface';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { MessageContentType } from '../notifications/enum/message-type.enum';
import { LastMessageStatusService } from '../notifications/last-message-status.service';
import { LookupService } from '../notifications/lookup/lookup.service';
import { MessageProcessTypeExtension } from '../notifications/message-job.dto';
import { QueueMessageService } from '../notifications/queue-message/queue-message.service';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { IntersolveVisaService } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ScopedQueryBuilder, ScopedRepository } from '../scoped.repository';
import { PermissionEnum } from '../user/permission.enum';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { getScopedRepositoryProviderName } from '../utils/scope/createScopedRepositoryProvider.helper';
import { FinancialServiceProviderEntity } from './../fsp/financial-service-provider.entity';
import { TryWhatsappEntity } from './../notifications/whatsapp/try-whatsapp.entity';
import { ImportRegistrationsDto, ImportResult } from './dto/bulk-import.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CustomDataDto } from './dto/custom-data.dto';
import { DownloadData } from './dto/download-data.interface';
import { MessageHistoryDto } from './dto/message-history.dto';
import { ReferenceIdDto } from './dto/reference-id.dto';
import { RegistrationDataRelation } from './dto/registration-data-relation.model';
import { RegistrationResponse } from './dto/registration-response.model';
import { ProgramAnswer } from './dto/store-program-answers.dto';
import {
  AdditionalAttributes,
  Attributes,
  UpdateRegistrationDto,
} from './dto/update-registration.dto';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import {
  AnswerTypes,
  CustomDataAttributes,
} from './enum/custom-data-attributes';
import { LanguageEnum } from './enum/language.enum';
import {
  RegistrationStatusDateMap,
  RegistrationStatusEnum,
  RegistrationStatusTimestampField,
} from './enum/registration-status.enum';
import { RegistrationChangeLogEntity } from './modules/registration-change-log/registration-change-log.entity';
import { RegistrationDataEntity } from './registration-data.entity';
import {
  RegistrationScopedRepository,
  RegistrationViewScopedRepository,
} from './registration-scoped.repository';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { RegistrationViewEntity } from './registration-view.entity';
import { RegistrationEntity } from './registration.entity';
import { InclusionScoreService } from './services/inclusion-score.service';
import {
  ImportType,
  RegistrationsImportService,
} from './services/registrations-import.service';
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
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly lastMessageStatusService: LastMessageStatusService,
    private readonly userService: UserService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(RegistrationStatusChangeEntity))
    private registrationStatusChangeScopedRepository: ScopedRepository<RegistrationStatusChangeEntity>,
    @Inject(getScopedRepositoryProviderName(RegistrationChangeLogEntity))
    private registrationChangeLogScopedRepo: ScopedRepository<RegistrationChangeLogEntity>,
    @Inject(getScopedRepositoryProviderName(TwilioMessageEntity))
    private twilioMessageScopedRepository: ScopedRepository<TwilioMessageEntity>,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
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
  ): Promise<RegistrationEntity> {
    const user = await this.findUserOrThrow(userId);
    const registration = new RegistrationEntity();
    registration.referenceId = postData.referenceId;
    registration.user = user;
    registration.program = await this.programRepository.findOneBy({
      id: programId,
    });
    await registration.save();
    return this.setRegistrationStatus(
      postData.referenceId,
      RegistrationStatusEnum.startedRegistration,
    );
  }

  public async setRegistrationStatus(
    referenceId: string,
    status: RegistrationStatusEnum,
  ): Promise<RegistrationEntity> {
    const registrationToUpdate =
      await this.getRegistrationFromReferenceId(referenceId);
    if (this.canChangeStatus(registrationToUpdate.registrationStatus, status)) {
      registrationToUpdate.registrationStatus = status;
      return await this.registrationScopedRepository.save(registrationToUpdate);
    }
  }

  public canChangeStatus(
    currentStatus: RegistrationStatusEnum,
    newStatus: RegistrationStatusEnum,
  ): boolean {
    let result = false;
    switch (newStatus) {
      case RegistrationStatusEnum.startedRegistration ||
        RegistrationStatusEnum.imported:
        result = [null].includes(currentStatus);
        break;
      case RegistrationStatusEnum.invited:
        result = [
          RegistrationStatusEnum.imported,
          RegistrationStatusEnum.noLongerEligible,
          null,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.registered:
        result = [
          RegistrationStatusEnum.imported,
          RegistrationStatusEnum.startedRegistration,
          null,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.noLongerEligible:
        result = [
          RegistrationStatusEnum.imported,
          RegistrationStatusEnum.invited,
          RegistrationStatusEnum.startedRegistration, // needed to transfer 'no longer eligible' status to registration from PA-app
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.registeredWhileNoLongerEligible:
        result = [RegistrationStatusEnum.noLongerEligible].includes(
          currentStatus,
        );
        break;
      case RegistrationStatusEnum.selectedForValidation:
        result = [RegistrationStatusEnum.registered].includes(currentStatus);
        break;
      case RegistrationStatusEnum.validated:
        result = [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.selectedForValidation,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.included:
        result = [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.selectedForValidation,
          RegistrationStatusEnum.validated,
          RegistrationStatusEnum.rejected,
          RegistrationStatusEnum.inclusionEnded,
          RegistrationStatusEnum.paused,
          RegistrationStatusEnum.completed,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.inclusionEnded:
        result = [
          RegistrationStatusEnum.included,
          RegistrationStatusEnum.completed,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.rejected:
        result = [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.selectedForValidation,
          RegistrationStatusEnum.validated,
          RegistrationStatusEnum.included,
          RegistrationStatusEnum.noLongerEligible,
          RegistrationStatusEnum.registeredWhileNoLongerEligible,
        ].includes(currentStatus);
        break;
      case RegistrationStatusEnum.deleted:
        result = [
          RegistrationStatusEnum.noLongerEligible,
          RegistrationStatusEnum.invited,
          RegistrationStatusEnum.imported,
          RegistrationStatusEnum.startedRegistration,
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.selectedForValidation,
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
    userId: number,
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
        await this.updateRegistration(
          programId,
          referenceId,
          {
            data,
            reason: 'Changed from field validation app.',
          },
          userId,
        );
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
      await this.registrationScopedRepository.save(registration);
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
    return await this.registrationScopedRepository.save(registration);
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
    );
    return await registration.saveData(customDataValue, {
      name: customDataKey,
    });
  }

  public async cleanCustomDataIfPhoneNr(
    customDataKey: string,
    customDataValue: string | number | string[],
  ): Promise<string | number | string[]> {
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
      if (customDataKey === CustomDataAttributes.phoneNumber) {
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

  public async addPhone(
    referenceId: string,
    phoneNumber: string,
    preferredLanguage: LanguageEnum,
    useForInvitationMatching?: boolean,
  ): Promise<void> {
    const sanitizedPhoneNr =
      await this.lookupService.lookupAndCorrect(phoneNumber);

    const currentRegistration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['fsp'],
    );

    const importedRegistration =
      await this.findImportedRegistrationByPhoneNumber(
        sanitizedPhoneNr,
        currentRegistration.programId,
      );
    if (!useForInvitationMatching || !importedRegistration) {
      // If endpoint is used for other purpose OR no imported registration found  ..
      // .. continue with current registration
      // .. and store phone number and language
      if (!currentRegistration.phoneNumber) {
        currentRegistration.phoneNumber = sanitizedPhoneNr;
      }
      currentRegistration.preferredLanguage = preferredLanguage;
      await this.registrationScopedRepository.save(currentRegistration);
      return;
    }

    // Remove old attributes (only relevant in edge case where Intersolve-voucher-whatsapp is stored as fsp, because of try-whatsapp-via-invitation scenario)
    const oldFsp = importedRegistration.fsp;
    if (oldFsp) {
      for (const attribute of oldFsp?.questions) {
        const regData = await importedRegistration.getRegistrationDataByName(
          attribute.name,
        );
        await this.registrationDataScopedRepository.deleteUnscoped({
          id: regData.id,
        });
      }
    }

    const registrationData = await this.registrationDataScopedRepository.find({
      where: { registrationId: importedRegistration.id },
    });

    // If imported registration found ..
    // .. then transfer relevant attributes from imported registration to current registration
    for (const d of registrationData) {
      const relation = new RegistrationDataRelation();
      relation.fspQuestionId = d.fspQuestionId;
      relation.programQuestionId = d.programQuestionId;
      relation.monitoringQuestionId = d.monitoringQuestionId;
      relation.programCustomAttributeId = d.programCustomAttributeId;
      await currentRegistration.saveData(d.value, { relation });
      await this.registrationDataScopedRepository.remove(d);
    }
    currentRegistration.paymentAmountMultiplier =
      importedRegistration.paymentAmountMultiplier;
    currentRegistration.maxPayments = importedRegistration.maxPayments;
    currentRegistration.notes = importedRegistration.notes;
    currentRegistration.scope = importedRegistration.scope;

    // .. and store phone number and language
    currentRegistration.phoneNumber = sanitizedPhoneNr;
    currentRegistration.preferredLanguage = preferredLanguage;

    // Update the 'imported' registration-changes to the current registration
    const importedRegistrationChanges =
      await this.registrationStatusChangeScopedRepository.find({
        where: {
          registrationId: importedRegistration.id,
        },
      });
    importedRegistrationChanges.forEach(
      (i) => (i.registration = currentRegistration),
    );
    await this.registrationStatusChangeScopedRepository.save(
      importedRegistrationChanges,
    );

    // .. and save the updated import-registration
    const updatedRegistration =
      await this.registrationScopedRepository.save(currentRegistration);

    // .. and update the try whatsapp entity
    const tryWhatsappEntity = await this.tryWhatsappRepository.findOne({
      where: { registrationId: importedRegistration.id },
    });
    if (tryWhatsappEntity) {
      tryWhatsappEntity.registration = updatedRegistration;
      await this.tryWhatsappRepository.save(tryWhatsappEntity);
    }

    // .. and update the twilio messages (to keep history of the invite message etc.)
    const twilioMessages = await this.twilioMessageScopedRepository.find({
      where: { registrationId: importedRegistration.id },
      order: { created: 'DESC' },
    });
    if (twilioMessages && twilioMessages.length > 0) {
      for (const message of twilioMessages) {
        message.registration = updatedRegistration;
      }
      await this.twilioMessageScopedRepository.save(twilioMessages);
      // Update the last message status of the new registration
      await this.lastMessageStatusService.updateLatestMessage(
        twilioMessages[0],
      );
    }

    // .. then delete the imported registration
    await this.registrationScopedRepository.remove(importedRegistration);

    // .. if imported registration status was noLongerEligible copy it, as this needs to be remembered
    if (
      importedRegistration.registrationStatus ===
      RegistrationStatusEnum.noLongerEligible
    ) {
      await this.setRegistrationStatus(
        updatedRegistration.referenceId,
        importedRegistration.registrationStatus,
      );
    }
  }

  private async findImportedRegistrationByPhoneNumber(
    phoneNumber: string,
    programId: number,
  ): Promise<RegistrationEntity> {
    const importStatuses = [
      RegistrationStatusEnum.imported,
      RegistrationStatusEnum.invited,
      RegistrationStatusEnum.noLongerEligible,
    ];
    return await this.registrationScopedRepository.findOne({
      where: {
        phoneNumber: phoneNumber,
        registrationStatus: In(importStatuses),
        programId: programId,
      },
      relations: ['fsp', 'data', 'fsp.questions', 'notes'],
    });
  }

  public async register(
    referenceId: string,
  ): Promise<ReferenceIdDto | boolean> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program'],
    );

    if (
      ![
        RegistrationStatusEnum.startedRegistration,
        RegistrationStatusEnum.noLongerEligible,
      ].includes(registration.registrationStatus)
    ) {
      const errors = `Registration status is not '${RegistrationStatusEnum.startedRegistration} or ${RegistrationStatusEnum.noLongerEligible}'`;
      throw new HttpException(errors, HttpStatus.NOT_FOUND);
    }

    // If status was 'no longer eligible', switch to 'registeredWhileNoLongerEligible', otherwise to 'registered'
    let registerResult;
    if (
      registration.registrationStatus ===
      RegistrationStatusEnum.noLongerEligible
    ) {
      registerResult = await this.setRegistrationStatus(
        registration.referenceId,
        RegistrationStatusEnum.registeredWhileNoLongerEligible,
      );
    } else {
      registerResult = await this.setRegistrationStatus(
        referenceId,
        RegistrationStatusEnum.registered,
      );
    }

    await this.inclusionScoreService.calculateInclusionScore(referenceId);

    await this.queueMessageService.addMessageToQueue(
      registration,
      null,
      RegistrationStatusEnum.registered,
      MessageContentType.registered,
      MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
    );

    if (
      !registerResult ||
      ![
        RegistrationStatusEnum.registered,
        RegistrationStatusEnum.registeredWhileNoLongerEligible,
      ].includes(registerResult.registrationStatus)
    ) {
      return false;
    }

    return { referenceId: registerResult.referenceId };
  }

  public async importBulkAsImported(
    csvFile,
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.registrationsImportService.importBulkAsImported(
      csvFile,
      program,
      userId,
    );
  }

  public async getImportRegistrationsTemplate(
    programId: number,
    type: ImportType,
  ): Promise<string[]> {
    if (!Object.values(ImportType).includes(type)) {
      throw new HttpException('Wrong import type', HttpStatus.BAD_REQUEST);
    }
    return await this.registrationsImportService.getImportRegistrationsTemplate(
      programId,
      type,
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

  public async importValidatedRegistrations(
    validatedImportRecords: ImportRegistrationsDto[],
    programId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.registrationsImportService.importValidatedRegistrations(
      validatedImportRecords,
      program,
    );
  }

  public async importJsonValidateRegistrations(
    validatedJsonData: ImportRegistrationsDto[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    return await this.registrationsImportService.validateRegistrationsInput(
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

  public async getRegistrationsForDashboard(
    programId: number,
  ): Promise<RegistrationResponse[]> {
    let q = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select('registration.id', 'id');

    q = q
      .addSelect('registration.registrationProgramId', 'registrationProgramId')
      .distinctOn(['registration.registrationProgramId'])
      .orderBy(`registration.registrationProgramId`, 'ASC')
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect('fsp.fsp', 'fsp')
      .addSelect('fsp.fspDisplayNamePortal', 'fspDisplayNamePortal')
      .addSelect(
        'registration.paymentAmountMultiplier',
        'paymentAmountMultiplier',
      )
      .addSelect('registration.maxPayments', 'maxPayments')
      .addSelect('registration.phoneNumber', 'phoneNumber')
      .leftJoin('registration.fsp', 'fsp');

    if (programId) {
      q.andWhere('registration.program.id = :programId', {
        programId: programId,
      });
    }
    this.addStatusChangeToQuery(q);

    const rows = await q.getRawMany();
    return rows;
  }

  public addStatusChangeToQuery(
    q: ScopedQueryBuilder<RegistrationEntity>,
  ): void {
    for (const registrationStatus in RegistrationStatusEnum) {
      const timestampField =
        RegistrationStatusTimestampField[
          RegistrationStatusDateMap[registrationStatus]
        ];
      q.addSelect(`${registrationStatus}.created`, timestampField)
        .addOrderBy(`${registrationStatus}.created`, 'DESC')
        .leftJoin(
          RegistrationStatusChangeEntity,
          registrationStatus,
          `registration.id = ${registrationStatus}.registrationId AND ${registrationStatus}.registrationStatus = '${registrationStatus}'`,
        );
    }
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

  public getDateColumPerStatus(
    filterStatus: RegistrationStatusEnum,
  ): RegistrationStatusTimestampField {
    switch (filterStatus) {
      case RegistrationStatusEnum.imported:
        return RegistrationStatusTimestampField.importedDate;
      case RegistrationStatusEnum.invited:
        return RegistrationStatusTimestampField.invitedDate;
      case RegistrationStatusEnum.noLongerEligible:
        return RegistrationStatusTimestampField.noLongerEligibleDate;
      case RegistrationStatusEnum.startedRegistration:
        return RegistrationStatusTimestampField.startedRegistrationDate;
      case RegistrationStatusEnum.registered:
        return RegistrationStatusTimestampField.registeredDate;
      case RegistrationStatusEnum.selectedForValidation:
        return RegistrationStatusTimestampField.selectedForValidationDate;
      case RegistrationStatusEnum.validated:
        return RegistrationStatusTimestampField.validationDate;
      case RegistrationStatusEnum.included:
        return RegistrationStatusTimestampField.inclusionDate;
      case RegistrationStatusEnum.inclusionEnded:
        return RegistrationStatusTimestampField.inclusionEndDate;
      case RegistrationStatusEnum.rejected:
        return RegistrationStatusTimestampField.rejectionDate;
      case RegistrationStatusEnum.registeredWhileNoLongerEligible:
        return RegistrationStatusTimestampField.registeredWhileNoLongerEligibleDate;
      case RegistrationStatusEnum.deleted:
        return RegistrationStatusTimestampField.deleteDate;
      case RegistrationStatusEnum.completed:
        return RegistrationStatusTimestampField.completedDate;
      case RegistrationStatusEnum.paused:
        return RegistrationStatusTimestampField.pausedDate;
    }
  }

  public async updateRegistration(
    programId: number,
    referenceId: string,
    updateRegistrationDto: UpdateRegistrationDto,
    userId: number,
  ): Promise<RegistrationEntity> {
    const partialRegistration = updateRegistrationDto.data;
    let registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program', 'fsp'],
      programId,
    );

    for (const attributeKey of Object.keys(partialRegistration)) {
      const oldValue =
        await registration.getRegistrationValueByName(attributeKey);
      const attributeValue = partialRegistration[attributeKey];
      registration = await this.updateAttribute(
        attributeKey,
        attributeValue,
        registration,
      );
      const newValue =
        await registration.getRegistrationValueByName(attributeKey);
      if (String(oldValue) !== String(newValue)) {
        const registrationChangeLog = new RegistrationChangeLogEntity();
        registrationChangeLog.registration = registration;
        registrationChangeLog.userId = userId;
        registrationChangeLog.fieldName = attributeKey;
        registrationChangeLog.oldValue = oldValue;
        registrationChangeLog.newValue = newValue;
        registrationChangeLog.reason = updateRegistrationDto.reason;

        await this.registrationChangeLogScopedRepo.save(registrationChangeLog);
      }
    }
    await this.inclusionScoreService.calculateInclusionScore(referenceId);
    return registration;
  }

  private async updateAttribute(
    attribute: Attributes | string,
    value: string | number | string[],
    registration: RegistrationEntity,
  ): Promise<RegistrationEntity> {
    value = await this.cleanCustomDataIfPhoneNr(attribute, value);

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
        await registration.saveData(value, { name: attribute });
      } catch (error) {
        // This is an exception because the phoneNumber is in the registration entity, not in the registrationData.
        if (attribute === Attributes.phoneNumber) {
          registration.phoneNumber = value.toString();
          await this.registrationScopedRepository.save(registration);
        } else {
          throw error;
        }
      }
    }
    const savedRegistration =
      await this.registrationScopedRepository.save(registration);
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
      await this.syncUpdatesWithThirdParties(registration, attribute);
    }

    return this.getRegistrationFromReferenceId(savedRegistration.referenceId, [
      'program',
    ]);
  }

  private async syncUpdatesWithThirdParties(
    registration: RegistrationEntity,
    attribute: Attributes | string,
  ): Promise<void> {
    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registration.id);
    if (registrationHasVisaCustomer) {
      try {
        await this.intersolveVisaService.syncIntersolveCustomerWith121(
          registration.referenceId,
          registration.programId,
          attribute,
        );
      } catch (error) {
        if (error?.response?.errors?.length > 0) {
          const errors = `SYNC TO INTERSOLVE ERROR: ${error.response.errors.join(
            ', ',
          )}. The update in 121 did succeed.`;
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
    if (!userId) {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }

    const programIds = await this.userService.getProgramIdsUserHasPermission(
      userId,
      PermissionEnum.RegistrationPersonalREAD,
    );

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
        return { programId: r.programId, referenceId: r.referenceId };
      });

      const matchingRegistrationData =
        await this.registrationDataScopedRepository
          .createQueryBuilder('registrationData')
          .leftJoinAndSelect('registrationData.registration', 'registration')
          .andWhere('registrationData.value = :phoneNumber', {
            phoneNumber: phoneNumber,
          })
          .andWhere('registration.program.id IN (:...programIds)', {
            programIds: programIds,
          })
          .getMany();

      for (const d of matchingRegistrationData) {
        const dataName = await d.getDataName();
        if (customAttributesPhoneNumberNames.includes(dataName)) {
          matchingRegistrations.push({
            programId: d.registration.programId,
            referenceId: d.registration.referenceId,
          });
        }
      }

      const uniqueRegistrations = matchingRegistrations.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.referenceId === value.referenceId),
      );

      for (const uniqueRegistration of uniqueRegistrations) {
        const registration = await this.getPaginateRegistrationForReferenceId(
          uniqueRegistration.referenceId,
          uniqueRegistration.programId,
        );
        registrations.push(registration);
      }
    }
    return registrations;
  }

  public async checkPermissionAndThrow(
    userId: number,
    permission: PermissionEnum,
    programId: number,
  ): Promise<void> {
    const programIds = await this.userService.getProgramIdsUserHasPermission(
      userId,
      permission,
    );
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
  ): Promise<RegistrationEntity> {
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

    // Check if potential phonenumbers are correct and clean them
    const newFspAttributes = {};
    for (const [key, value] of Object.entries(newFspAttributesRaw)) {
      newFspAttributes[key] = await this.cleanCustomDataIfPhoneNr(key, value);
    }

    // Get registration by referenceId
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['fsp', 'fsp.questions'],
    );
    if (registration.fsp?.id === newFsp.id) {
      const errors = `New FSP is the same as existing FSP for this Person Affected.`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    // Remove old attributes
    const oldFsp = registration.fsp;
    for (const attribute of oldFsp?.questions) {
      const regData = await registration.getRegistrationDataByName(
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
      await this.addRegistrationData(
        referenceId,
        attribute.name,
        newFspAttributes[attribute.name],
      );
    }
    return await this.registrationScopedRepository.save(updatedRegistration);
  }

  public async downloadValidationData(userId: number): Promise<DownloadData> {
    const user =
      await this.userService.findUserProgramAssignmentsOrThrow(userId);
    const programIds = user.programAssignments.map((p) => p.program.id);
    const data = {
      answers: await this.getAllProgramAnswers(user),
      fspData: await this.getAllFspAnswers(programIds),
      programIds: user.programAssignments.map((assignment) => {
        return assignment.program.id;
      }),
    };
    return data;
  }

  public async getAllProgramAnswers(
    user: UserEntity,
  ): Promise<RegistrationDataEntity[]> {
    const programIds = user.programAssignments.map((p) => p.program.id);
    const registrationsToValidate = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .addSelect('"referenceId"')
      .leftJoinAndSelect('registration.program', 'program')
      .leftJoinAndSelect('registration.data', 'data')
      .leftJoinAndSelect('data.programQuestion', 'programQuestion')
      .andWhere('registration.program.id IN (:...programIds)', {
        programIds: programIds,
      })
      .andWhere('"registrationStatus" IN (:...registrationStatuses)', {
        registrationStatuses: [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.selectedForValidation,
        ],
      })
      .andWhere('data.programQuestionId is not null')
      .getMany();
    let answers = [];
    for (const r of registrationsToValidate) {
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
    programIds: number[],
  ): Promise<FspAnswersAttrInterface[]> {
    const registrations = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.fsp', 'fsp')
      .leftJoinAndSelect('fsp.questions', ' fsp_question.fsp')
      .leftJoin('registration.program', 'program')
      .andWhere('registration.fsp IS NOT NULL')
      .andWhere('registration.program.id IN (:...programIds)', {
        programIds: programIds,
      })
      .andWhere('"registrationStatus" IN (:...registrationStatuses)', {
        registrationStatuses: [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.selectedForValidation,
        ],
      })
      .getMany();

    const fspDataPerRegistration = [];
    for (const registration of registrations) {
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
    userId: number,
  ): Promise<void> {
    await this.storeProgramAnswers(
      payload.referenceId,
      payload.programAnswers,
      programId,
      userId,
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

  public async getRegistrationStatusChanges(
    programId: number,
    referenceId: string,
  ): Promise<any[]> {
    const qb = await this.registrationStatusChangeScopedRepository
      .createQueryBuilder('registrationStatusChange')
      .andWhere('registration.referenceId = :referenceId', {
        referenceId,
      })
      .andWhere('registration.programId = :programId', {
        programId,
      })
      .leftJoinAndSelect(
        'registrationStatusChange.registration',
        'registration',
      )
      .orderBy('registrationStatusChange.created', 'DESC');
    qb.getQueryAndParameters();
    const statusChanges = await qb.getMany();

    return await Promise.all(
      statusChanges.map((statusChange) => {
        return {
          status: statusChange.registrationStatus,
          date: statusChange.created,
        };
      }),
    );
  }
}
