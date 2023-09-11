import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { AnswerSet, FspAnswersAttrInterface } from '../fsp/fsp-interface';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { MessageContentType } from '../notifications/enum/message-type.enum';
import { LookupService } from '../notifications/lookup/lookup.service';
import { MessageService } from '../notifications/message.service';
import { TwilioMessageEntity } from '../notifications/twilio.entity';
import { WhatsappPendingMessageEntity } from '../notifications/whatsapp/whatsapp-pending-message.entity';
import { VisaErrorCodes } from '../payments/fsp-integration/intersolve-visa/enum/visa-error-codes.enum';
import { IntersolveVisaService } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomRequestEntity } from '../payments/fsp-integration/safaricom/safaricom-request.entity';
import { ImageCodeExportVouchersEntity } from '../payments/imagecode/image-code-export-vouchers.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { PersonAffectedAppDataEntity } from '../people-affected/person-affected-app-data.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ProgramService } from '../programs/programs.service';
import { AzureLogService } from '../shared/services/azure-log.service';
import { PermissionEnum } from '../user/permission.enum';
import { UserEntity } from '../user/user.entity';
import { FinancialServiceProviderEntity } from './../fsp/financial-service-provider.entity';
import { TryWhatsappEntity } from './../notifications/whatsapp/try-whatsapp.entity';
import { ImportRegistrationsDto, ImportResult } from './dto/bulk-import.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CustomDataDto } from './dto/custom-data.dto';
import { DownloadData } from './dto/download-data.interface';
import { MessageHistoryDto } from './dto/message-history.dto';
import { NoteDto } from './dto/note.dto';
import { ReferenceIdDto, ReferenceIdsDto } from './dto/reference-id.dto';
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
  GenericAttributes,
  QuestionType,
} from './enum/custom-data-attributes';
import { LanguageEnum } from './enum/language.enum';
import {
  RegistrationStatusDateMap,
  RegistrationStatusEnum,
  RegistrationStatusTimestampField,
} from './enum/registration-status.enum';
import { RegistrationChangeLogEntity } from './modules/registration-change-log/registration-change-log.entity';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { RegistrationEntity } from './registration.entity';
import { BulkImportService, ImportType } from './services/bulk-import.service';
import { InclusionScoreService } from './services/inclusion-score.service';

@Injectable()
export class RegistrationsService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationStatusChangeEntity)
  private readonly registrationStatusChangeRepository: Repository<RegistrationStatusChangeEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(RegistrationDataEntity)
  private readonly registrationDataRepository: Repository<RegistrationDataEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspAttributeRepository: Repository<FspQuestionEntity>;
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(PersonAffectedAppDataEntity)
  private readonly personAffectedAppDataRepository: Repository<PersonAffectedAppDataEntity>;
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  @InjectRepository(WhatsappPendingMessageEntity)
  private readonly whatsappPendingMessageRepository: Repository<WhatsappPendingMessageEntity>;
  @InjectRepository(ImageCodeExportVouchersEntity)
  private readonly imageCodeExportVouchersRepo: Repository<ImageCodeExportVouchersEntity>;
  @InjectRepository(IntersolveVoucherEntity)
  private readonly intersolveVoucherRepo: Repository<IntersolveVoucherEntity>;
  @InjectRepository(SafaricomRequestEntity)
  private readonly safaricomRequestRepo: Repository<SafaricomRequestEntity>;
  @InjectRepository(RegistrationChangeLogEntity)
  private readonly registrationChangeLog: Repository<RegistrationChangeLogEntity>;

  public constructor(
    private readonly lookupService: LookupService,
    private readonly azureLogService: AzureLogService,
    private readonly messageService: MessageService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly bulkImportService: BulkImportService,
    private readonly programService: ProgramService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly dataSource: DataSource,
  ) {}

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
    const registrationToUpdate = await this.getRegistrationFromReferenceId(
      referenceId,
    );
    registrationToUpdate.registrationStatus = status;
    return await this.registrationRepository.save(registrationToUpdate);
  }

  private canChangeStatus(
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
        result = currentStatus !== RegistrationStatusEnum.deleted;
        break;
      case RegistrationStatusEnum.completed:
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

    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: relations,
    });
    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known.`;
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
      await this.registrationRepository.save(registration);
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
    return await this.registrationRepository.save(registration);
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
    const sanitizedPhoneNr = await this.lookupService.lookupAndCorrect(
      phoneNumber,
    );

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
      await this.registrationRepository.save(currentRegistration);
      return;
    }

    // Remove old attributes (only relevant in edge case where Intersolve-voucher-whatsapp is stored as fsp, because of try-whatsapp-via-invitation scenario)
    const oldFsp = importedRegistration.fsp;
    if (oldFsp) {
      for (const attribute of oldFsp?.questions) {
        const regData = await importedRegistration.getRegistrationDataByName(
          attribute.name,
        );
        await this.registrationDataRepository.delete({
          id: regData.id,
        });
      }
    }

    const registrationData = await this.registrationDataRepository.find({
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
      await this.registrationDataRepository.remove(d);
    }
    currentRegistration.paymentAmountMultiplier =
      importedRegistration.paymentAmountMultiplier;
    currentRegistration.maxPayments = importedRegistration.maxPayments;
    currentRegistration.note = importedRegistration.note;
    currentRegistration.noteUpdated = importedRegistration.noteUpdated;

    // .. and store phone number and language
    currentRegistration.phoneNumber = sanitizedPhoneNr;
    currentRegistration.preferredLanguage = preferredLanguage;

    // Update the 'imported' registration-changes to the current registration
    const importedRegistrationChanges =
      await this.registrationStatusChangeRepository.find({
        where: {
          registrationId: importedRegistration.id,
        },
      });
    importedRegistrationChanges.forEach(
      (i) => (i.registration = currentRegistration),
    );
    await this.registrationStatusChangeRepository.save(
      importedRegistrationChanges,
    );

    // .. and save the updated import-registration
    const updatedRegistration = await this.registrationRepository.save(
      currentRegistration,
    );

    // .. and update the try whatsapp entity
    const tryWhatsappEntity = await this.tryWhatsappRepository.findOne({
      where: { registrationId: importedRegistration.id },
    });
    if (tryWhatsappEntity) {
      tryWhatsappEntity.registration = updatedRegistration;
      await this.tryWhatsappRepository.save(tryWhatsappEntity);
    }

    // .. and update the twilio messages (to keep history of the invite message etc.)
    const twilioMessages = await this.twilioMessageRepository.find({
      where: { registrationId: importedRegistration.id },
    });
    if (twilioMessages) {
      for (const message of twilioMessages) {
        message.registration = updatedRegistration;
      }
      await this.twilioMessageRepository.save(twilioMessages);
    }

    // .. then delete the imported registration
    await this.registrationRepository.remove(importedRegistration);

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
    return await this.registrationRepository.findOne({
      where: {
        phoneNumber: phoneNumber,
        registrationStatus: In(importStatuses),
        programId: programId,
      },
      relations: ['fsp', 'data', 'fsp.questions'],
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

    await this.messageService.sendTextMessage(
      registration,
      registration.program.id,
      null,
      RegistrationStatusEnum.registered,
      null,
      MessageContentType.registered,
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

  public async importBulk(
    csvFile,
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.bulkImportService.importBulk(csvFile, program, userId);
  }

  public async getImportRegistrationsTemplate(
    programId: number,
    type: ImportType,
  ): Promise<string[]> {
    if (!Object.values(ImportType).includes(type)) {
      throw new HttpException('Wrong import type', HttpStatus.BAD_REQUEST);
    }
    return await this.bulkImportService.getImportRegistrationsTemplate(
      programId,
      type,
    );
  }

  public async importRegistrations(
    csvFile,
    programId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.bulkImportService.importRegistrations(csvFile, program);
  }

  public async importValidatedRegistrations(
    validatedImportRecords: ImportRegistrationsDto[],
    programId: number,
  ): Promise<ImportResult> {
    const program = await this.findProgramOrThrow(programId);
    return await this.bulkImportService.importValidatedRegistrations(
      validatedImportRecords,
      program,
    );
  }

  public async importJsonValidateRegistrations(
    validatedJsonData: ImportRegistrationsDto[],
    programId: number,
  ): Promise<ImportRegistrationsDto[]> {
    return await this.bulkImportService.validateRegistrationsInput(
      validatedJsonData,
      programId,
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

  public async getRegistrations(
    programId: number,
    includePersonalData: boolean,
    includePaymentData: boolean,
    includeDeletedRegistrations: boolean,
    referenceId: string,
    filterOnPayment?: number,
    requestedDynamicAttributes?: string[],
  ): Promise<RegistrationResponse[]> {
    let q = this.registrationRepository
      .createQueryBuilder('registration')
      .select('registration.id', 'id')
      .where('1 = 1');

    if (includePaymentData) {
      q = this.includeTransactionData(q);
    }

    q = this.includeLastMessage(q);

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
      .addSelect('registration.note', 'note')
      .leftJoin('registration.fsp', 'fsp');

    if (includePersonalData) {
      let dynamicAttributes = await this.programService.getPaTableAttributes(
        programId,
      );
      dynamicAttributes = dynamicAttributes.filter(
        (value, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.name === value.name &&
              t.questionType === value.questionType &&
              t.type === value.type,
          ),
      ); // deduplicate attributes

      const subquery = this.registrationDataRepository
        .createQueryBuilder('rd')
        .leftJoin('rd.programQuestion', 'programQuestion')
        .leftJoin('rd.programCustomAttribute', 'programCustomAttribute')
        .leftJoin('rd.fspQuestion', 'fspQuestion')
        .select('"registrationId"')
        .groupBy('"registrationId"');
      for (const dynamicAttribute of dynamicAttributes) {
        if (dynamicAttribute.name === GenericAttributes.phoneNumber) {
          continue;
        }
        if (
          !requestedDynamicAttributes || // if the param is not passed, then return all (instead of nothing)
          requestedDynamicAttributes.includes(dynamicAttribute.name) // if someting passed, return only those
        ) {
          if (dynamicAttribute.questionType === QuestionType.programQuestion) {
            if (dynamicAttribute.type === AnswerTypes.multiSelect) {
              // Currently multi-select is only used for program-questions
              subquery.addSelect(
                `ARRAY_REMOVE(ARRAY_AGG(CASE WHEN programQuestion.name = '${dynamicAttribute.name}' THEN rd.value END),NULL)`,
                dynamicAttribute.name,
              );
            } else {
              subquery.addSelect(
                `MAX(CASE WHEN programQuestion.name = '${dynamicAttribute.name}' THEN rd.value END)`,
                dynamicAttribute.name,
              );
            }
          } else if (
            dynamicAttribute.questionType ===
            QuestionType.programCustomAttribute
          ) {
            subquery.addSelect(
              `MAX(CASE WHEN programCustomAttribute.name = '${dynamicAttribute.name}' THEN rd.value END)`,
              dynamicAttribute.name,
            );
          } else if (
            dynamicAttribute.questionType === QuestionType.fspQuestion
          ) {
            subquery.addSelect(
              `MAX(CASE WHEN "fspQuestion".name = '${dynamicAttribute.name}' THEN rd.value END)`,
              dynamicAttribute.name,
            );
          }
        }
      }
      q.leftJoinAndSelect(
        `(${subquery.getQuery()})`,
        'subquery',
        'subquery."registrationId" = registration.id',
      );
    }

    if (programId) {
      q.andWhere('registration.program.id = :programId', {
        programId: programId,
      });
    }

    if (filterOnPayment) {
      q.leftJoin(
        TransactionEntity,
        'transaction',
        'transaction."registrationId" = registration.id',
      ).andWhere('transaction.payment = :payment', {
        payment: filterOnPayment,
      });
    }

    this.addStatusChangeToQuery(q);
    if (!includeDeletedRegistrations) {
      q.andWhere('registration.registrationStatus != :status', {
        status: RegistrationStatusEnum.deleted,
      });
    }

    if (referenceId) {
      q.addSelect('registration.programId', 'programId');
      q.andWhere('registration.referenceId = :referenceId', {
        referenceId: referenceId,
      });
    }

    const rows = await q.getRawMany();

    if (!includePersonalData) {
      for (const row of rows) {
        row['hasPhoneNumber'] = !!row.phoneNumber;
        delete row.phoneNumber;
      }
      return rows;
    }

    const program = await this.programService.findProgramOrThrow(programId);
    for (const row of rows) {
      row['name'] = this.getName(row, program);
      row['hasNote'] = !!row.note;
      row['hasPhoneNumber'] = !!row.phoneNumber;
    }
    return rows;
  }

  private includeLastMessage(
    q: SelectQueryBuilder<RegistrationEntity>,
  ): SelectQueryBuilder<RegistrationEntity> {
    q.leftJoin(
      (qb) =>
        qb
          .from(TwilioMessageEntity, 'messages')
          .select('MAX("created")', 'created')
          .addSelect('"registrationId"', 'registrationId')
          .groupBy('"registrationId"'),
      'messages_max_created',
      'messages_max_created."registrationId" = registration.id',
    )
      .leftJoin(
        'registration.twilioMessages',
        'twilioMessages',
        `twilioMessages.created = messages_max_created.created`,
      )
      .addSelect([
        '"twilioMessages"."status" AS "lastMessageStatus"',
        '"twilioMessages"."type" AS "lastMessageType"',
      ]);
    return q;
  }

  public addStatusChangeToQuery(
    q: SelectQueryBuilder<RegistrationEntity>,
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

  private includeTransactionData(
    q: SelectQueryBuilder<RegistrationEntity>,
  ): SelectQueryBuilder<RegistrationEntity> {
    q.leftJoin(
      (qb) =>
        qb
          .from(TransactionEntity, 'transactions')
          .select('MAX("payment")', 'payment')
          .addSelect('COUNT(DISTINCT(payment))', 'nrPayments')
          .addSelect('"registrationId"', 'registrationId')
          .groupBy('"registrationId"'),
      'transaction_max_payment',
      'transaction_max_payment."registrationId" = registration.id',
    )
      .leftJoin(
        (qb) =>
          qb
            .from(TransactionEntity, 'transactions')
            .select('MAX("transactionStep")', 'transactionStep')
            .addSelect('"payment"', 'payment')
            .groupBy('"payment"')
            .addSelect('"registrationId"', 'registrationId')
            .addGroupBy('"registrationId"'),
        'transaction_max_transaction_step',
        `transaction_max_transaction_step."registrationId" = registration.id
      AND transaction_max_transaction_step.payment = transaction_max_payment.payment`,
      )
      .leftJoin(
        (qb) =>
          qb
            .from(TransactionEntity, 'transactions')
            .select('MAX("created")', 'created')
            .addSelect('"payment"', 'payment')
            .groupBy('"payment"')
            .addSelect('"transactionStep"', 'transactionStep')
            .addGroupBy('"transactionStep"')
            .addSelect('"registrationId"', 'registrationId')
            .addGroupBy('"registrationId"'),
        'transaction_max_created',
        `transaction_max_created."registrationId" = registration.id
      AND transaction_max_created.payment = transaction_max_payment.payment
      AND transaction_max_created."transactionStep" = transaction_max_transaction_step."transactionStep"`,
      )
      .leftJoin(
        'registration.transactions',
        'transaction',
        `transaction."registrationId" = transaction_max_created."registrationId"
      AND transaction.payment = transaction_max_created.payment
      AND transaction."transactionStep" = transaction_max_created."transactionStep"
      AND transaction."created" = transaction_max_created."created"`,
      )
      .addSelect([
        'transaction.created AS "paymentDate"',
        'transaction.payment AS payment',
        'transaction.status AS "transactionStatus"',
        'transaction.amount AS "transactionAmount"',
        'transaction.errorMessage as "errorMessage"',
        'transaction.customData as "customData"',
        'transaction_max_payment."nrPayments" as "nrPayments"',
      ]);
    return q;
  }

  public async getLatestDateForRegistrationStatus(
    registrationId: number,
    status: RegistrationStatusEnum,
  ): Promise<Date> {
    const registrationStatusChange =
      await this.registrationStatusChangeRepository.findOne({
        where: {
          registration: { id: registrationId },
          registrationStatus: status,
        },
        order: { created: 'DESC' },
      });
    return registrationStatusChange ? registrationStatusChange.created : null;
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
      const oldValue = await registration.getRegistrationValueByName(
        attributeKey,
      );
      const attributeValue = partialRegistration[attributeKey];
      registration = await this.updateAttribute(
        attributeKey,
        attributeValue,
        registration,
      );
      const newValue = await registration.getRegistrationValueByName(
        attributeKey,
      );
      if (String(oldValue) !== String(newValue)) {
        await this.registrationChangeLog.save({
          registration,
          userId,
          fieldName: attributeKey,
          oldValue,
          newValue,
          reason: updateRegistrationDto.reason,
        });
      }
    }
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
          await this.registrationRepository.save(registration);
        } else {
          throw error;
        }
      }
    }
    const savedRegistration = await this.registrationRepository.save(
      registration,
    );
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
        // don't throw error if the reason is that the customer doesn't exist yet
        if (!error?.response?.errors?.includes(VisaErrorCodes.NoCustomerYet)) {
          const errors = `SYNC TO INTERSOLVE ERROR: ${error.response.errors}. The update in 121 did succeed.`;
          throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }
  }

  public async updateNote(referenceId: string, note: string): Promise<NoteDto> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    registration.note = note;
    registration.noteUpdated = new Date();
    await this.registrationRepository.save(registration);
    const newNote = new NoteDto();
    newNote.note = registration.note;
    newNote.noteUpdated = registration.noteUpdated;
    return newNote;
  }

  public async retrieveNote(referenceId: string): Promise<NoteDto> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    const note = new NoteDto();
    note.note = registration.note;
    note.noteUpdated = registration.noteUpdated;
    return note;
  }

  public async updateRegistrationStatusBatch(
    referenceIdsDto: ReferenceIdsDto,
    registrationStatus: RegistrationStatusEnum,
    message?: string,
    messageContentType?: MessageContentType,
  ): Promise<void> {
    const errors = [];
    for (const referenceId of referenceIdsDto.referenceIds) {
      const registrationToUpdate = await this.registrationRepository.findOne({
        where: { referenceId: referenceId },
      });
      if (!registrationToUpdate) {
        errors.push(`Registration '${referenceId}' is not found`);
      } else if (
        !this.canChangeStatus(
          registrationToUpdate.registrationStatus,
          registrationStatus,
        )
      ) {
        errors.push(
          `Registration '${referenceId}' has status '${registrationToUpdate.registrationStatus}' which cannot be changed to ${registrationStatus}`,
        );
      }
    }
    if (errors.length === 0) {
      let programId;
      let program;
      for (const referenceId of referenceIdsDto.referenceIds) {
        const updatedRegistration = await this.setRegistrationStatus(
          referenceId,
          registrationStatus,
        );
        if (message) {
          if (updatedRegistration.programId !== programId) {
            programId = updatedRegistration.programId;
            // avoid a query per PA if not necessary
            program = await this.programRepository.findOne({
              where: { id: programId },
            });
          }
          const tryWhatsappFirst =
            registrationStatus === RegistrationStatusEnum.invited
              ? program.tryWhatsAppFirst
              : false;
          this.messageService
            .sendTextMessage(
              updatedRegistration,
              programId,
              message,
              null,
              tryWhatsappFirst,
              messageContentType,
            )
            .catch((error) => {
              this.azureLogService.logError(error, true);
            });
        }
      }
    } else {
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
  }

  public async searchRegistration(
    rawPhoneNumber: string,
    userId: number,
  ): Promise<RegistrationResponse[]> {
    const registrations = [];
    if (!userId) {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }
    // const programIds = user.programAssignments.map(p => p.program.id);

    const programIds = await this.getProgramIdsUserHasPermission(
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
      );

      const matchingRegistrations = (
        await this.registrationRepository.find({
          where: { phoneNumber: phoneNumber },
        })
      ).map((r) => {
        return { programId: r.programId, referenceId: r.referenceId };
      });

      const matchingRegistrationData = await this.dataSource
        .getRepository(RegistrationDataEntity)
        .createQueryBuilder('registrationData')
        .leftJoinAndSelect('registrationData.registration', 'registration')
        .where('registrationData.value = :phoneNumber', {
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
        const registration = (
          await this.getRegistrations(
            uniqueRegistration.programId,
            true,
            false,
            true,
            uniqueRegistration.referenceId,
          )
        )[0];
        registrations.push(registration);
      }
    }
    return registrations;
  }

  private async getProgramIdsUserHasPermission(
    userId: number,
    permission: PermissionEnum,
  ): Promise<number[]> {
    const user = await this.programService.findUserProgramAssignmentsOrThrow(
      userId,
    );
    const programIds = [];
    for (const assignment of user.programAssignments) {
      for (const role of assignment.roles) {
        if (role.permissions.map((p) => p.name).includes(permission)) {
          programIds.push(assignment.programId);
        }
      }
    }
    return programIds;
  }

  public async checkPermissionAndThrow(
    userId: number,
    permission: PermissionEnum,
    programId: number,
  ): Promise<void> {
    const programIds = await this.getProgramIdsUserHasPermission(
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
    await this.programService.findUserProgramAssignmentsOrThrow(userId);
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
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['fsp', 'fsp.questions'],
    });
    if (!registration) {
      const errors = `ReferenceId ${referenceId} is not known.`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
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
      await this.registrationDataRepository.delete({ id: regData.id });
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
    return await this.registrationRepository.save(updatedRegistration);
  }

  public async deleteBatch(referenceIdsDto: ReferenceIdsDto): Promise<void> {
    // Do this first, so that error is already thrown if a PA cannot be changed to deleted, before removing any data below
    await this.updateRegistrationStatusBatch(
      referenceIdsDto,
      RegistrationStatusEnum.deleted,
    );

    for await (const referenceId of referenceIdsDto.referenceIds) {
      const registration = await this.getRegistrationFromReferenceId(
        referenceId,
        ['user'],
      );

      // Delete all data for this registration
      await this.registrationDataRepository.delete({
        registrationId: registration.id,
      });
      if (registration.user) {
        await this.personAffectedAppDataRepository.delete({
          user: { id: registration.user.id },
        });
      }
      await this.twilioMessageRepository.delete({
        registrationId: registration.id,
      });
      await this.whatsappPendingMessageRepository.delete({
        registrationId: registration.id,
      });
      await this.tryWhatsappRepository.delete({
        registrationId: registration.id,
      });

      // anonymize some data for this registration
      registration.phoneNumber = null;
      registration.note = null;
      await this.registrationRepository.save(registration);

      // FSP-specific
      // intersolve-voucher
      const voucherImages = await this.imageCodeExportVouchersRepo.find({
        where: { registrationId: registration.id },
        relations: ['voucher'],
      });
      const vouchersToUpdate = [];
      for await (const voucherImage of voucherImages) {
        const voucher = await this.intersolveVoucherRepo.findOne({
          where: { id: voucherImage.voucher.id },
        });
        voucher.whatsappPhoneNumber = null;
        vouchersToUpdate.push(voucher);
      }
      await this.intersolveVoucherRepo.save(vouchersToUpdate);
      //safaricom
      const safaricomRequests = await this.safaricomRequestRepo.find({
        where: { transaction: { registration: { id: registration.id } } },
        relations: ['transaction', 'transaction.registration'],
      });
      const requestsToUpdate = [];
      for (const request of safaricomRequests) {
        request.requestResult = JSON.parse(
          JSON.stringify(request.requestResult).replace(request.partyB, ''),
        );
        request.paymentResult = JSON.parse(
          JSON.stringify(request.paymentResult).replace(request.partyB, ''),
        );
        request.transaction.customData = JSON.parse(
          JSON.stringify(request.transaction.customData).replace(
            request.partyB,
            '',
          ),
        );
        request.partyB = '';
        requestsToUpdate.push(request);
      }
      await this.safaricomRequestRepo.save(requestsToUpdate);
      // TODO: at_notification + belcash_request
    }
  }

  public async downloadValidationData(userId: number): Promise<DownloadData> {
    const user = await this.programService.findUserProgramAssignmentsOrThrow(
      userId,
    );
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
    const registrationsToValidate = await this.dataSource
      .getRepository(RegistrationEntity)
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
    const registrations = await this.dataSource
      .getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.fsp', 'fsp')
      .leftJoinAndSelect('fsp.questions', ' fsp_question.fsp')
      .leftJoin('registration.program', 'program')
      .where('registration.fsp IS NOT NULL')
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
    const qb = await this.dataSource
      .getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.fsp', 'fsp')
      .leftJoinAndSelect('fsp.questions', ' fsp_attribute.fsp')
      .where('registration.referenceId = :referenceId', {
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
        await this.registrationDataRepository.remove(data);
      }
    }
  }

  public async sendCustomTextMessage(
    referenceIds: string[],
    message: string,
  ): Promise<void> {
    const validRegistrations: RegistrationEntity[] = [];
    for (const referenceId of referenceIds) {
      const registration = await this.getRegistrationFromReferenceId(
        referenceId,
        ['program'],
      );
      if (!registration.phoneNumber) {
        const errors = `Registration with referenceId: ${registration.referenceId} has no phonenumber.`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      validRegistrations.push(registration);
    }
    for (const validRegistration of validRegistrations) {
      this.messageService
        .sendTextMessage(
          validRegistration,
          validRegistration.program.id,
          message,
          null,
          null,
          MessageContentType.custom,
        )
        .catch((err) => {
          console.log('err: ', err);
        });
    }
  }

  public async getMessageHistoryRegistration(
    referenceId: string,
  ): Promise<MessageHistoryDto[]> {
    const messageHistoryArray = await this.registrationRepository
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
      .where('registration.referenceId = :referenceId', {
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
    const q = await this.registrationRepository.findOne({
      select: { referenceId: true },
      where: { programId: programId, registrationProgramId: paId },
    });

    return q;
  }
}
