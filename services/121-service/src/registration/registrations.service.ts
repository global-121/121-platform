import { WhatsappService } from './../notifications/whatsapp/whatsapp.service';
import { FinancialServiceProviderEntity } from './../fsp/financial-service-provider.entity';
import { SmsService } from './../notifications/sms/sms.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, In, Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { RegistrationEntity } from './registration.entity';
import {
  RegistrationStatusEnum,
  RegistrationStatusTimestampField,
} from './enum/registration-status.enum';
import { ProgramAnswer } from './dto/store-program-answers.dto';
import { ProgramAnswerEntity } from './program-answer.entity';
import {
  AnswerTypes,
  CustomDataAttributes,
} from './enum/custom-data-attributes';
import { LookupService } from '../notifications/lookup/lookup.service';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { FspName } from '../fsp/financial-service-provider.entity';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { InlusionScoreService } from './services/inclusion-score.service';
import { BulkImportService, ImportType } from './services/bulk-import.service';
import { ImportResult } from './dto/bulk-import.dto';
import { RegistrationResponse } from './dto/registration-response.model';
import { NoteDto } from './dto/note.dto';
import { validate } from 'class-validator';
import { DownloadData } from './dto/download-data.interface';
import { AnswerSet, FspAnswersAttrInterface } from '../fsp/fsp-interface';
import { Attributes } from './dto/update-attribute.dto';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import { InclusionStatus } from './dto/inclusion-status.dto';
import { ReferenceIdDto, ReferenceIdsDto } from './dto/reference-id.dto';
import { MessageHistoryDto } from './dto/message-history.dto';

@Injectable()
export class RegistrationsService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationStatusChangeEntity)
  private readonly registrationStatusChangeRepository: Repository<
    RegistrationStatusChangeEntity
  >;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramAnswerEntity)
  private readonly programAnswerRepository: Repository<ProgramAnswerEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly lookupService: LookupService,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
    private readonly inclusionScoreService: InlusionScoreService,
    private readonly bulkImportService: BulkImportService,
  ) {}

  private async findUserOrThrow(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      const errors = 'This user is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  public async create(
    postData: CreateRegistrationDto,
    userId: number,
  ): Promise<RegistrationEntity> {
    const user = await this.findUserOrThrow(userId);
    let registration = new RegistrationEntity();
    registration.referenceId = postData.referenceId;
    registration.user = user;
    registration.program = await this.programRepository.findOne(
      postData.programId,
    );
    await this.registrationRepository.save(registration);
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

  private async getRegistrationFromReferenceId(
    referenceId: string,
    relations: string[] = [],
  ): Promise<RegistrationEntity> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: relations,
    });
    if (!registration) {
      const errors = 'This referenceId is not known.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return registration;
  }

  public async storeProgramAnswers(
    referenceId: string,
    rawProgramAnswers: ProgramAnswer[],
  ): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program'],
    );
    const programAnswers = await this.cleanAnswers(
      rawProgramAnswers,
      registration.program.id,
    );
    for (let answer of programAnswers) {
      const programQuestion = await this.programQuestionRepository.findOne({
        where: { name: answer.programQuestionName },
      });
      const oldAnswer = await this.programAnswerRepository.findOne({
        where: {
          registration: { id: registration.id },
          programQuestion: { id: programQuestion.id },
        },
      });
      if (oldAnswer) {
        oldAnswer.programAnswer = answer.programAnswer;
        await this.programAnswerRepository.save(oldAnswer);
      } else {
        let newAnswer = new ProgramAnswerEntity();
        newAnswer.registration = registration;
        newAnswer.programQuestion = programQuestion;
        newAnswer.programAnswer = answer.programAnswer;
        await this.programAnswerRepository.save(newAnswer);
      }
    }
    await this.storePersistentAnswers(programAnswers, referenceId);
    await this.inclusionScoreService.calculateInclusionScore(referenceId);
  }

  public async cleanAnswers(
    programAnswers: ProgramAnswer[],
    programId: number,
  ): Promise<ProgramAnswer[]> {
    const program = await this.programRepository.findOne(programId, {
      relations: ['programQuestions'],
    });
    const phonenumberTypedAnswers = [];
    for (let programQuestion of program.programQuestions) {
      if (programQuestion.answerType == AnswerTypes.tel) {
        phonenumberTypedAnswers.push(programQuestion.name);
      }
    }
    // const fspTelAttributes = await this.fspAttributeRepository.find({
    //   where: { answerType: AnswerTypes.tel },
    // });
    // for (let fspAttr of fspTelAttributes) {
    //   phonenumberTypedAnswers.push(fspAttr.name);
    // }

    const cleanedAnswers = [];
    for (let programAnswer of programAnswers) {
      if (phonenumberTypedAnswers.includes(programAnswer.programQuestionName)) {
        programAnswer.programAnswer = await this.lookupService.lookupAndCorrect(
          programAnswer.programAnswer,
        );
      }
      cleanedAnswers.push(programAnswer);
    }
    return cleanedAnswers;
  }

  public async storePersistentAnswers(
    programAnswers: ProgramAnswer[],
    referenceId: string,
  ): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program'],
    );
    const programId = registration.program.id;
    const cleanedAnswers = await this.cleanAnswers(programAnswers, programId);
    const program = await this.programRepository.findOne(programId, {
      relations: ['programQuestions'],
    });
    const persistentQuestions = [];
    for (let question of program.programQuestions) {
      if (question.persistence) {
        persistentQuestions.push(question.name);
      }
    }

    let customDataToStore;
    if (!registration.customData) {
      customDataToStore = {};
    } else {
      customDataToStore = registration.customData;
    }

    for (let answer of cleanedAnswers) {
      if (persistentQuestions.includes(answer.programQuestionName)) {
        customDataToStore[answer.programQuestionName] = answer.programAnswer;
      }
      if (answer.programQuestionName === CustomDataAttributes.phoneNumber) {
        registration.phoneNumber = answer.programAnswer;
      }
    }
    registration.customData = JSON.parse(JSON.stringify(customDataToStore));

    await this.registrationRepository.save(registration);
  }

  public async addFsp(
    referenceId: string,
    fspId: number,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    const fsp = await this.fspRepository.findOne({
      where: { id: fspId },
      relations: ['attributes'],
    });
    registration.fsp = fsp;
    return await this.registrationRepository.save(registration);
  }

  public async addCustomData(
    referenceId: string,
    customDataKey: string,
    customDataValueRaw: string,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    const customDataValue = await this.cleanCustomDataIfPhoneNr(
      customDataKey,
      customDataValueRaw,
    );
    if (!(customDataKey in registration.customData)) {
      registration.customData[customDataKey] = customDataValue;
    }
    return await this.registrationRepository.save(registration);
  }

  public async cleanCustomDataIfPhoneNr(
    customDataKey: string,
    customDataValue: string | number,
  ): Promise<string | number> {
    const answersTypeTel = [];
    const fspAttributesTypeTel = await this.fspAttributeRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (let fspAttr of fspAttributesTypeTel) {
      answersTypeTel.push(fspAttr.name);
    }
    const programQuestionsTypeTel = await this.programQuestionRepository.find({
      where: { answerType: AnswerTypes.tel },
    });
    for (let question of programQuestionsTypeTel) {
      answersTypeTel.push(question.name);
    }
    if (answersTypeTel.includes(customDataKey)) {
      return await this.lookupService.lookupAndCorrect(String(customDataValue));
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

    const importedRegistration = await this.findImportedRegistrationByPhoneNumber(
      sanitizedPhoneNr,
    );
    const currentRegistration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['fsp'],
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

    // If imported registration found ..
    // .. then transfer relevant attributes from imported registration to current registration
    currentRegistration.namePartnerOrganization =
      importedRegistration.namePartnerOrganization;
    currentRegistration.paymentAmountMultiplier =
      importedRegistration.paymentAmountMultiplier;

    // .. and store phone number and language
    currentRegistration.phoneNumber = sanitizedPhoneNr;
    currentRegistration.preferredLanguage = preferredLanguage;

    // Update the 'imported' registration-changes to the current registration
    const importedRegistrationChanges = await this.registrationStatusChangeRepository.find(
      {
        where: {
          registration: importedRegistration,
        },
      },
    );
    importedRegistrationChanges.forEach(
      i => (i.registration = currentRegistration),
    );
    await this.registrationStatusChangeRepository.save(
      importedRegistrationChanges,
    );
    // .. then delete the imported registration
    await this.registrationRepository.remove(importedRegistration);

    // .. and save the updated import-registration
    const updatedRegistration = await this.registrationRepository.save(
      currentRegistration,
    );

    // .. if imported registration status was noLongerEligible set to registeredWhileNoLongerEligible
    if (
      importedRegistration.registrationStatus ===
      RegistrationStatusEnum.noLongerEligible
    ) {
      await this.setRegistrationStatus(
        updatedRegistration.referenceId,
        RegistrationStatusEnum.registeredWhileNoLongerEligible,
      );
    }
  }

  private async findImportedRegistrationByPhoneNumber(
    phoneNumber: string,
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
      },
      relations: ['fsp'],
    });
  }

  public async addQrIdentifier(
    referenceId: string,
    qrIdentifier: string,
  ): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);

    const duplicateIdentifier = await this.registrationRepository.findOne({
      where: { qrIdentifier: qrIdentifier },
    });
    if (duplicateIdentifier) {
      const errors = 'This QR identifier already exists';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    registration.qrIdentifier = qrIdentifier;
    await this.registrationRepository.save(registration);
  }

  public async register(referenceId: string): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      referenceId,
      ['program'],
    );

    if (
      RegistrationStatusEnum.startedRegistration !==
      registration.registrationStatus
    ) {
      const errors = `Registration status is not 'startedRegistration'`;
      throw new HttpException(errors, HttpStatus.NOT_FOUND);
    }

    await this.setRegistrationStatus(
      referenceId,
      RegistrationStatusEnum.registered,
    );
    this.inclusionScoreService.calculateInclusionScore(referenceId);
    this.sendTextMessage(
      registration,
      registration.program.id,
      null,
      RegistrationStatusEnum.registered,
    );
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

  private async findProgramOrThrow(programId: number): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public async getRegistrationsForProgram(
    programId: number,
    includePersonalData: boolean,
  ): Promise<RegistrationResponse[]> {
    let q = await this.registrationRepository
      .createQueryBuilder('registration')
      .select('registration.id', 'id')
      .distinctOn(['registration.id'])
      .orderBy(`registration.id`, 'ASC')
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect('fsp.fsp', 'fsp')
      .addSelect(
        'registration.namePartnerOrganization',
        'namePartnerOrganization',
      )
      .addSelect(
        'registration.paymentAmountMultiplier',
        'paymentAmountMultiplier',
      )
      .addSelect(
        `${RegistrationStatusEnum.startedRegistration}.created`,
        RegistrationStatusTimestampField.startedRegistrationDate,
      )
      .addOrderBy(
        `${RegistrationStatusEnum.startedRegistration}.created`,
        'DESC',
      )
      .addSelect(
        `${RegistrationStatusEnum.imported}.created`,
        RegistrationStatusTimestampField.importedDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.imported}.created`, 'DESC')
      .addSelect(
        `${RegistrationStatusEnum.invited}.created`,
        RegistrationStatusTimestampField.invitedDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.invited}.created`, 'DESC')
      .addSelect(
        `${RegistrationStatusEnum.noLongerEligible}.created`,
        RegistrationStatusTimestampField.noLongerEligibleDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.noLongerEligible}.created`, 'DESC')
      .addSelect(
        `${RegistrationStatusEnum.registered}.created`,
        RegistrationStatusTimestampField.registeredDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.registered}.created`, 'DESC')
      .addSelect(
        `${RegistrationStatusEnum.selectedForValidation}.created`,
        RegistrationStatusTimestampField.selectedForValidationDate,
      )
      .addOrderBy(
        `${RegistrationStatusEnum.selectedForValidation}.created`,
        'DESC',
      )
      .addSelect(
        `${RegistrationStatusEnum.validated}.created`,
        RegistrationStatusTimestampField.validationDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.validated}.created`, 'DESC')
      .addSelect(
        `${RegistrationStatusEnum.included}.created`,
        RegistrationStatusTimestampField.inclusionDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.included}.created`, 'DESC')
      .addSelect(
        `${RegistrationStatusEnum.inclusionEnded}.created`,
        RegistrationStatusTimestampField.inclusionEndDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.inclusionEnded}.created`, 'DESC')
      .addSelect(
        `${RegistrationStatusEnum.rejected}.created`,
        RegistrationStatusTimestampField.rejectionDate,
      )
      .addOrderBy(`${RegistrationStatusEnum.rejected}.created`, 'DESC')
      .leftJoin('registration.fsp', 'fsp')
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.startedRegistration,
        `registration.id = ${RegistrationStatusEnum.startedRegistration}.registrationId AND ${RegistrationStatusEnum.startedRegistration}.registrationStatus = '${RegistrationStatusEnum.startedRegistration}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.imported,
        `registration.id = ${RegistrationStatusEnum.imported}.registrationId AND ${RegistrationStatusEnum.imported}.registrationStatus = '${RegistrationStatusEnum.imported}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.invited,
        `registration.id = ${RegistrationStatusEnum.invited}.registrationId AND ${RegistrationStatusEnum.invited}.registrationStatus = '${RegistrationStatusEnum.invited}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.noLongerEligible,
        `registration.id = ${RegistrationStatusEnum.noLongerEligible}.registrationId AND ${RegistrationStatusEnum.noLongerEligible}.registrationStatus = '${RegistrationStatusEnum.noLongerEligible}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.registered,
        `registration.id = ${RegistrationStatusEnum.registered}.registrationId AND ${RegistrationStatusEnum.registered}.registrationStatus = '${RegistrationStatusEnum.registered}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.selectedForValidation,
        `registration.id = ${RegistrationStatusEnum.selectedForValidation}.registrationId AND ${RegistrationStatusEnum.selectedForValidation}.registrationStatus = '${RegistrationStatusEnum.selectedForValidation}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.validated,
        `registration.id = ${RegistrationStatusEnum.validated}.registrationId AND ${RegistrationStatusEnum.validated}.registrationStatus = '${RegistrationStatusEnum.validated}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.included,
        `registration.id = ${RegistrationStatusEnum.included}.registrationId AND ${RegistrationStatusEnum.included}.registrationStatus = '${RegistrationStatusEnum.included}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.inclusionEnded,
        `registration.id = ${RegistrationStatusEnum.inclusionEnded}.registrationId AND ${RegistrationStatusEnum.inclusionEnded}.registrationStatus = '${RegistrationStatusEnum.inclusionEnded}'`,
      )
      .leftJoin(
        RegistrationStatusChangeEntity,
        RegistrationStatusEnum.rejected,
        `registration.id = ${RegistrationStatusEnum.rejected}.registrationId AND ${RegistrationStatusEnum.rejected}.registrationStatus = '${RegistrationStatusEnum.rejected}'`,
      )
      .where('registration.program.id = :programId', { programId: programId });

    if (!includePersonalData) {
      return await q.getRawMany();
    }

    q = q.addSelect('registration.phoneNumber', 'phoneNumber');
    q = q.addSelect('registration.note', 'note');
    q = q.addSelect('registration.customData', 'customData');

    const rows = await q.getRawMany();
    const responseRows = [];
    for (let row of rows) {
      row['name'] = this.getName(row.customData);
      row['hasNote'] = !!row.note;
      row['phoneNumber'] =
        row.phoneNumber || row.customData[CustomDataAttributes.phoneNumber];
      row['whatsappPhoneNumber'] =
        row.customData[CustomDataAttributes.whatsappPhoneNumber];
      row['vnumber'] = row.customData['vnumber'];
      delete row.customData;
      responseRows.push(row);
    }
    return responseRows;
  }

  public async getLatestDateForRegistrationStatus(
    registration: RegistrationEntity,
    status: RegistrationStatusEnum,
  ): Promise<Date> {
    const registrationStatusChange = await this.registrationStatusChangeRepository.findOne(
      {
        where: {
          registration: { id: registration.id },
          registrationStatus: status,
        },
        order: { created: 'DESC' },
      },
    );
    return registrationStatusChange ? registrationStatusChange.created : null;
  }

  public getName(customData): string {
    if (customData[CustomDataAttributes.name]) {
      return customData[CustomDataAttributes.name];
    } else if (customData[CustomDataAttributes.firstName]) {
      return (
        customData[CustomDataAttributes.firstName] +
        (customData[CustomDataAttributes.secondName]
          ? ' ' + customData[CustomDataAttributes.secondName]
          : '') +
        (customData[CustomDataAttributes.thirdName]
          ? ' ' + customData[CustomDataAttributes.thirdName]
          : '')
      );
    } else if (customData[CustomDataAttributes.nameFirst]) {
      return (
        customData[CustomDataAttributes.nameFirst] +
        (customData[CustomDataAttributes.nameLast]
          ? ' ' + customData[CustomDataAttributes.nameLast]
          : '')
      );
    } else {
      return '';
    }
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
    }
  }

  public async updateAttribute(
    referenceId: string,
    attribute: Attributes,
    value: string | number,
  ): Promise<RegistrationEntity> {
    const registration = await this.getRegistrationFromReferenceId(referenceId);
    let attributeFound = false;

    if (typeof registration[attribute] !== 'undefined') {
      registration[attribute] = await this.cleanCustomDataIfPhoneNr(
        attribute,
        value,
      );
      attributeFound = true;
    }
    if (
      registration.customData &&
      typeof registration.customData[attribute] !== 'undefined'
    ) {
      registration.customData[attribute] = await this.cleanCustomDataIfPhoneNr(
        attribute,
        value,
      );
      attributeFound = true;
    }

    if (!attributeFound) {
      const errors = 'This attribute is not known for this Person Affected.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const errors = await validate(registration);
    if (errors.length > 0) {
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    return await this.registrationRepository.save(registration);
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
    programId: number,
    referenceIdsDto: ReferenceIdsDto,
    registrationStatus: RegistrationStatusEnum,
    message?: string,
  ): Promise<void> {
    await this.findProgramOrThrow(programId);

    for (let referenceId of referenceIdsDto.referenceIds) {
      const registration = await this.setRegistrationStatus(
        referenceId,
        registrationStatus,
      );

      if (message) {
        this.sendTextMessage(registration, programId, message);
      }
    }
  }

  public async invite(
    programId: number,
    phoneNumbers: string,
    message?: string,
  ): Promise<void> {
    await this.findProgramOrThrow(programId);

    for (let phoneNumber of JSON.parse(phoneNumbers['phoneNumbers'])) {
      const sanitizedPhoneNr = await this.lookupService.lookupAndCorrect(
        phoneNumber,
      );
      let registration = await this.registrationRepository.findOne({
        where: { phoneNumber: sanitizedPhoneNr },
      });
      if (!registration) continue;

      this.setRegistrationStatus(
        registration.referenceId,
        RegistrationStatusEnum.invited,
      );

      if (message) {
        this.sendTextMessage(registration, programId, message);
      }
    }
  }

  private async sendTextMessage(
    registration: RegistrationEntity,
    programId: number,
    message?: string,
    key?: string,
  ): Promise<void> {
    if (!message && !key) {
      throw new HttpException(
        'A message or a key should be supplied.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let whatsappNumber;
    if (registration.customData) {
      whatsappNumber =
        registration.customData[CustomDataAttributes.whatsappPhoneNumber];
    }
    if (!registration.phoneNumber && !whatsappNumber) {
      throw new HttpException(
        'A recipientPhoneNr should be supplied.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const messageText = message
      ? message
      : await this.getNotificationText(
          registration.preferredLanguage,
          key,
          programId,
        );

    if (whatsappNumber) {
      this.whatsappService.queueMessageSendTemplate(
        messageText,
        whatsappNumber,
        null,
        null,
        registration.id,
        registration.preferredLanguage,
      );
    } else if (registration.phoneNumber) {
      this.smsService.sendSms(
        messageText,
        registration.phoneNumber,
        registration.id,
      );
    }
  }

  public async getNotificationText(
    language: string,
    key: string,
    programId: number,
  ): Promise<string> {
    const program = await getRepository(ProgramEntity).findOne(programId);
    const fallbackNotifications = program.notifications[this.fallbackLanguage];
    let notifications = fallbackNotifications;

    if (program.notifications[language]) {
      notifications = program.notifications[language];
    }
    if (notifications[key]) {
      return notifications[key];
    }
    return fallbackNotifications[key] ? fallbackNotifications[key] : '';
  }

  public async searchRegistration(
    rawPhoneNumber?: string,
    name?: string,
    id?: number,
  ): Promise<RegistrationEntity[]> {
    const phoneNumber = await this.lookupService.lookupAndCorrect(
      rawPhoneNumber,
    );

    const registrations = await this.registrationRepository.find({
      relations: ['fsp'],
    });
    return registrations.filter(registration => {
      return (
        (name &&
          (registration.customData[CustomDataAttributes.name] === name ||
            registration.customData[CustomDataAttributes.nameFirst] === name ||
            registration.customData[CustomDataAttributes.nameLast] === name ||
            registration.customData[CustomDataAttributes.firstName] === name ||
            registration.customData[CustomDataAttributes.secondName] === name ||
            registration.customData[CustomDataAttributes.thirdName] ===
              name)) ||
        (phoneNumber &&
          (registration.customData[CustomDataAttributes.phoneNumber] ===
            phoneNumber ||
            registration.customData[
              CustomDataAttributes.whatsappPhoneNumber
            ] === phoneNumber ||
            registration.phoneNumber === phoneNumber)) ||
        registration.id === id
      );
    });
  }

  public async updateChosenFsp(
    referenceId: string,
    newFspName: FspName,
    newFspAttributesRaw: object,
  ): Promise<RegistrationEntity> {
    //Identify new FSP
    const newFsp = await this.fspRepository.findOne({
      where: { fsp: newFspName },
      relations: ['attributes'],
    });
    if (!newFsp) {
      const errors = `FSP with this name not found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // Check if required attributes are present

    newFsp.attributes.forEach(requiredAttribute => {
      if (
        !newFspAttributesRaw ||
        !Object.keys(newFspAttributesRaw).includes(requiredAttribute.name)
      ) {
        const requiredAttributes = newFsp.attributes
          .map(a => a.name)
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
      relations: ['fsp', 'fsp.attributes'],
    });
    if (registration.fsp.id === newFsp.id) {
      const errors = `New FSP is the same as existing FSP for this Person Affected.`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    // Remove old attributes
    const oldFsp = registration.fsp;
    oldFsp.attributes.forEach(attribute => {
      Object.keys(registration.customData).forEach(key => {
        if (attribute.name === key) {
          delete registration.customData[key];
        }
      });
    });
    await this.registrationRepository.save(registration);

    // Update FSP
    const updatedRegistration = await this.addFsp(referenceId, newFsp.id);

    // Add new attributes

    for (const attribute of updatedRegistration.fsp.attributes) {
      await this.addCustomData(
        referenceId,
        attribute.name,
        newFspAttributes[attribute.name],
      );

      updatedRegistration.customData[
        attribute.name
      ] = await this.cleanCustomDataIfPhoneNr(
        attribute.name,
        newFspAttributes[attribute.name],
      );
    }
    return await this.registrationRepository.save(updatedRegistration);
  }

  public async deleteBatch(referenceIdsDto: ReferenceIdsDto): Promise<void> {
    const registrations = [];
    const users = [];
    for (let referenceId of referenceIdsDto.referenceIds) {
      const registration = await this.registrationRepository.findOne({
        where: { referenceId: referenceId },
        relations: ['user'],
      });
      if (!registration) {
        throw new HttpException(
          `Registration '${referenceId}' is not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      registrations.push(registration);
      // Also delete user if present (not in the case of imported PAs)
      if (registration.user) {
        const user = await this.userRepository.findOne(registration.user.id);
        users.push(user);
      }
    }
    await this.registrationRepository.remove(registrations);
    await this.userRepository.remove(users);
  }

  public async downloadValidationData(userId: number): Promise<DownloadData> {
    const user = await this.userRepository.findOne(userId, {
      relations: ['programAssignments', 'programAssignments.program'],
    });
    if (
      !user ||
      !user.programAssignments ||
      user.programAssignments.length === 0
    ) {
      const errors = 'User not found or no assigned programs';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    const programIds = user.programAssignments.map(p => p.program.id);
    const data = {
      answers: await this.getAllProgramAnswers(user),
      fspData: await this.getAllFspAnswers(programIds),
      qrRegistrationMapping: await this.getQrRegistrationMapping(programIds),
      programIds: user.programAssignments.map(assignment => {
        return assignment.program.id;
      }),
    };
    return data;
  }

  public async getAllProgramAnswers(user: UserEntity): Promise<any[]> {
    const programIds = user.programAssignments.map(p => p.program.id);
    const registrationsToValidate = await getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .addSelect('"referenceId"')
      .leftJoinAndSelect('registration.program', 'program')
      .leftJoinAndSelect('registration.programAnswers', 'programAnswers')
      .leftJoinAndSelect('programAnswers.programQuestion', 'programQuestion')
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

    let answers = [];
    for (const r of registrationsToValidate) {
      for (const a of r.programAnswers) {
        a['referenceId'] = r.referenceId;
        a['programId'] = r.program.id;
      }
      answers = [...answers, ...r.programAnswers];
    }
    return answers;
  }

  public async getAllFspAnswers(
    programIds: number[],
  ): Promise<FspAnswersAttrInterface[]> {
    const regsitrations = await getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.fsp', 'fsp')
      .leftJoinAndSelect('fsp.attributes', ' fsp_attribute.fsp')
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
    for (const registration of regsitrations) {
      const answers = this.getFspAnswers(
        registration.fsp.attributes,
        registration.customData,
      );
      const fspData = {
        attributes: registration.fsp.attributes,
        answers: answers,
        referenceId: registration.referenceId,
      };
      fspDataPerRegistration.push(fspData);
    }
    return fspDataPerRegistration;
  }

  public getFspAnswers(
    fspAttributes: FspAttributeEntity[],
    customData: JSON,
  ): AnswerSet {
    const fspAttributeNames = [];
    for (const attribute of fspAttributes) {
      fspAttributeNames.push(attribute.name);
    }
    const fspCustomData = {};
    for (const key in customData) {
      if (fspAttributeNames.includes(key)) {
        fspCustomData[key] = {
          name: key,
          value: customData[key],
        };
      }
    }
    return fspCustomData;
  }

  public async getQrRegistrationMapping(
    programIds: number[],
  ): Promise<RegistrationEntity[]> {
    return await this.registrationRepository
      .createQueryBuilder('registration')
      .select(['registration.qrIdentifier', 'registration.referenceId'])
      .where('registration."programId" IN (:...programIds)', {
        programIds: programIds,
      })
      .andWhere('"registrationStatus" IN (:...registrationStatuses)', {
        registrationStatuses: [
          RegistrationStatusEnum.registered,
          RegistrationStatusEnum.selectedForValidation,
        ],
      })
      .getMany();
  }

  // AW: get answers to attributes for a given PA (identified first through referenceId/QR)
  public async get(referenceId: string): Promise<RegistrationEntity> {
    return await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['program', 'programAnswers', 'program.programQuestions'],
    });
  }

  public async getFspAnswersAttributes(
    referenceId: string,
  ): Promise<FspAnswersAttrInterface> {
    const qb = await getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.fsp', 'fsp')
      .leftJoinAndSelect('fsp.attributes', ' fsp_attribute.fsp')
      .where('registration.referenceId = :referenceId', {
        referenceId: referenceId,
      });
    const registration = await qb.getOne();
    const fspAnswers = this.getFspAnswers(
      registration.fsp.attributes,
      registration.customData,
    );
    return {
      attributes: registration.fsp.attributes,
      answers: fspAnswers,
      referenceId: referenceId,
    };
  }

  // Used by Aidworker
  public async issueValidation(payload: ValidationIssueDataDto): Promise<void> {
    await this.storeProgramAnswers(payload.referenceId, payload.programAnswers);
    await this.setRegistrationStatus(
      payload.referenceId,
      RegistrationStatusEnum.validated,
    );
  }

  public async findReferenceIdWithQrIdentifier(
    qrIdentifier: string,
  ): Promise<ReferenceIdDto> {
    let registration = await this.registrationRepository.findOne({
      where: { qrIdentifier: qrIdentifier },
    });
    if (!registration) {
      const errors = 'No registration found for QR';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return { referenceId: registration.referenceId };
  }

  public async getInclusionStatus(
    programId: number,
    referenceId: string,
  ): Promise<InclusionStatus> {
    let registration = await this.getRegistrationFromReferenceId(referenceId);

    await this.findProgramOrThrow(programId);

    let inclusionStatus: InclusionStatus;

    if (registration.registrationStatus === RegistrationStatusEnum.included) {
      inclusionStatus = { status: RegistrationStatusEnum.included };
    } else if (
      registration.registrationStatus === RegistrationStatusEnum.rejected
    ) {
      inclusionStatus = { status: RegistrationStatusEnum.rejected };
    } else {
      inclusionStatus = { status: 'unavailable' };
    }

    return inclusionStatus;
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
      this.sendTextMessage(
        validRegistration,
        validRegistration.program.id,
        message,
      );
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
        'twilioMessage.mediaUrl as mediaUrl',
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
}
