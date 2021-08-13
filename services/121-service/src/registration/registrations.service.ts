import { SmsService } from './../notifications/sms/sms.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserEntity } from '../user/user.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import {
  ProgramAnswer,
  StoreProgramAnswersDto,
} from './dto/store-program-answers.dto';
import { ProgramAnswerEntity } from './program-answer.entity';
import {
  AnswerTypes,
  CustomDataAttributes,
} from '../connection/validation-data/dto/custom-data-attributes';
import { LookupService } from '../notifications/lookup/lookup.service';
import { ProgramQuestionEntity } from '../programs/program/program-question.entity';
import { FspAttributeEntity } from '../programs/fsp/fsp-attribute.entity';
import {
  FinancialServiceProviderEntity,
  fspName,
} from '../programs/fsp/financial-service-provider.entity';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { InlusionScoreService } from './services/inclusion-score.service';
import { BulkImportService } from './services/bulk-import.service';
import { ImportResult } from '../connection/dto/bulk-import.dto';
import { ConnectionResponse } from '../models/connection-response.model';
import { RegistrationResponse } from '../models/registration-response.model';
import { NoteDto } from '../connection/dto/note.dto';
import { validate } from 'class-validator';
import { Attributes } from '../connection/dto/update-attribute.dto';
import { ExportType } from '../programs/program/dto/export-details';
import { FileDto } from '../programs/program/dto/file.dto';
import { ExportService } from './services/export.service';
import { PaStatusTimestampField } from '../models/pa-status.model';
import { ConnectionEntity } from '../connection/connection.entity';

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

  public constructor(
    private readonly lookupService: LookupService,
    private readonly smsService: SmsService,
    private readonly inclusionScoreService: InlusionScoreService,
    private readonly bulkImportService: BulkImportService,
    private readonly exportService: ExportService,
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
      RegistrationStatusEnum.startedRegistation,
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
    storeProgramAnswersDto: StoreProgramAnswersDto,
  ): Promise<void> {
    const registration = await this.getRegistrationFromReferenceId(
      storeProgramAnswersDto.referenceId,
      ['program'],
    );
    const programAnswers = await this.cleanAnswers(
      storeProgramAnswersDto.programAnswers,
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

    await this.storePersistentAnswers(
      programAnswers,
      registration.program.id,
      storeProgramAnswersDto.referenceId,
    );
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
    programId: number,
    referenceId: string,
  ): Promise<void> {
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

    const registration = await this.getRegistrationFromReferenceId(referenceId);
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
    const connection = await this.getRegistrationFromReferenceId(referenceId);
    const customDataValue = await this.cleanCustomDataIfPhoneNr(
      customDataKey,
      customDataValueRaw,
    );
    if (!(customDataKey in connection.customData)) {
      connection.customData[customDataKey] = customDataValue;
    }
    return await this.registrationRepository.save(connection);
  }

  public async cleanCustomDataIfPhoneNr(
    customDataKey: string,
    customDataValue: string,
  ): Promise<string> {
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
      return await this.lookupService.lookupAndCorrect(customDataValue);
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
    await this.registrationRepository.save(currentRegistration);
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
      RegistrationStatusEnum.startedRegistation !==
      registration.registrationStatus
    ) {
      const errors = `Registration status is not 'startedRegistration'`;
      throw new HttpException(errors, HttpStatus.NOT_FOUND);
    }

    await this.registrationRepository.save(registration);
    this.inclusionScoreService.calculateInclusionScore(referenceId);
    this.smsService.notifyBySms(
      registration.phoneNumber,
      registration.preferredLanguage,
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
  ): Promise<string[]> {
    return await this.bulkImportService.getImportRegistrationsTemplate(
      programId,
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
    const registrations = await this.getAllRegistrations(programId);

    const registrationsResponse = [];
    for (let registration of registrations) {
      const registrationResponse = new RegistrationResponse();
      registrationResponse['id'] = registration.id;
      registrationResponse['referenceId'] = registration.referenceId;
      registrationResponse['status'] = registration.registrationStatus;
      registrationResponse['inclusionScore'] = registration.inclusionScore;
      registrationResponse['fsp'] = registration.fsp?.fsp;
      registrationResponse['namePartnerOrganization'] =
        registration.namePartnerOrganization;
      registrationResponse['paymentAmountMultiplier'] =
        registration.paymentAmountMultiplier;

      registrationResponse[
        PaStatusTimestampField.created
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.startedRegistation,
      );
      registrationResponse[
        PaStatusTimestampField.importedDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.imported,
      );
      registrationResponse[
        PaStatusTimestampField.invitedDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.invited,
      );
      registrationResponse[
        PaStatusTimestampField.noLongerEligibleDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.noLongerEligible,
      );
      registrationResponse[
        PaStatusTimestampField.registeredDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.registered,
      );
      registrationResponse[
        PaStatusTimestampField.selectedForValidationDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.selectedForValidation,
      );
      registrationResponse[
        PaStatusTimestampField.validationDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.validated,
      );
      registrationResponse[
        PaStatusTimestampField.inclusionDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.included,
      );
      registrationResponse[
        PaStatusTimestampField.inclusionEndDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.inclusionEnded,
      );
      registrationResponse[
        PaStatusTimestampField.rejectionDate
      ] = await this.exportService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum.rejected,
      );

      if (includePersonalData) {
        registrationResponse['name'] = this.exportService.getName(
          registration.customData,
        );
        registrationResponse['phoneNumber'] =
          registration.phoneNumber ||
          registration.customData[CustomDataAttributes.phoneNumber];
        registrationResponse['whatsappPhoneNumber'] =
          registration.customData[CustomDataAttributes.whatsappPhoneNumber];
        registrationResponse['vnumber'] = registration.customData['vnumber'];
        registrationResponse['hasNote'] = !!registration.note;
      }

      registrationsResponse.push(registrationResponse);
    }
    return registrationsResponse;
  }

  private async getAllRegistrations(
    programId: number,
  ): Promise<RegistrationEntity[]> {
    return await this.registrationRepository.find({
      where: { program: { id: programId } },
      relations: ['fsp'],
      order: { inclusionScore: 'DESC' },
    });
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
        String(value),
      );
      attributeFound = true;
    }
    if (
      registration.customData &&
      typeof registration.customData[attribute] !== 'undefined'
    ) {
      registration.customData[attribute] = await this.cleanCustomDataIfPhoneNr(
        attribute,
        String(value),
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

  public async getExportList(
    programId: number,
    type: ExportType,
    installment: number | null = null,
    userId: number,
  ): Promise<FileDto> {
    return await this.exportService.getExportList(
      programId,
      type,
      installment,
      userId,
    );
  }

  public async updateRegistrationStatusBatch(
    programId: number,
    referenceIds: object,
    registrationStatus: RegistrationStatusEnum,
    message?: string,
  ): Promise<void> {
    await this.findProgramOrThrow(programId);

    for (let referenceId of JSON.parse(referenceIds['referenceIds'])) {
      const registration = await this.setRegistrationStatus(
        referenceId,
        registrationStatus,
      );

      if (message) {
        this.sendSmsMessage(registration, programId, message);
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
        this.sendSmsMessage(registration, programId, message);
      }
    }
  }

  private async sendSmsMessage(
    registration: RegistrationEntity,
    programId: number,
    message?: string,
  ): Promise<void> {
    this.smsService.notifyBySms(
      registration.phoneNumber,
      registration.preferredLanguage,
      programId,
      message,
      null,
    );
  }

  public async searchRegistration(
    phoneNumber?: string,
    name?: string,
    id?: number,
  ): Promise<RegistrationEntity[]> {
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
    newFspName: fspName,
    newFspAttributes: object,
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
        !newFspAttributes ||
        !Object.keys(newFspAttributes).includes(requiredAttribute.name)
      ) {
        const requiredAttributes = newFsp.attributes
          .map(a => a.name)
          .join(', ');
        const errors = `Not all required FSP attributes provided correctly: ${requiredAttributes}`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    });

    // Get connection by referenceId
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
    updatedRegistration.fsp.attributes.forEach(async attribute => {
      updatedRegistration.customData[attribute.name] =
        newFspAttributes[attribute.name];
    });

    return await this.registrationRepository.save(updatedRegistration);
  }

  public async delete(referenceId: string): Promise<void> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['statusChanges', 'programAnswers'],
    });
    await this.registrationStatusChangeRepository.remove(
      registration.statusChanges,
    );
    await this.programAnswerRepository.remove(registration.programAnswers);
    await this.registrationRepository.remove(registration);
  }
}
