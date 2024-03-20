import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AdditionalActionType } from '../../actions/action.entity';
import { ActionService } from '../../actions/action.service';
import { EventsService } from '../../events/events.service';
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../../fsp/fsp-question.entity';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { CustomAttributeType } from '../../programs/dto/create-program-custom-attribute.dto';
import { ProgramCustomAttributeEntity } from '../../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../../programs/program-question.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { ProgramService } from '../../programs/programs.service';
import { ScopedRepository } from '../../scoped.repository';
import { UserService } from '../../user/user.service';
import { FileImportService } from '../../utils/file-import/file-import.service';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import {
  BulkImportDto,
  BulkImportResult,
  ImportRegistrationsDto,
  ImportResult,
  ImportStatus,
} from '../dto/bulk-import.dto';
import { BulkUpdateDto } from '../dto/bulk-update.dto';
import { RegistrationDataInfo } from '../dto/registration-data-relation.model';
import { RegistrationsUpdateJobDto as RegistrationUpdateJobDto } from '../dto/registration-update-job.dto';
import { AdditionalAttributes } from '../dto/update-registration.dto';
import { ValidationConfigDto } from '../dto/validate-registration-config.dto';
import { ValidateRegistrationErrorObjectDto } from '../dto/validate-registration-error-object.dto';
import {
  AnswerTypes,
  Attribute,
  GenericAttributes,
  QuestionType,
} from '../enum/custom-data-attributes';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationCsvValidationEnum } from '../enum/registration-csv-validation.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { QueueRegistrationUpdateService } from '../modules/queue-registrations-update/queue-registrations-update.service';
import { RegistrationUtilsService } from '../modules/registration-utilts/registration-utils.service';
import { RegistrationDataEntity } from '../registration-data.entity';
import { RegistrationEntity } from '../registration.entity';
import { InclusionScoreService } from './inclusion-score.service';

export enum ImportType {
  imported = 'import-as-imported',
  registered = 'import-as-registered',
}

@Injectable()
export class RegistrationsImportService {
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(ProgramCustomAttributeEntity)
  private readonly programCustomAttributeRepository: Repository<ProgramCustomAttributeEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspAttributeRepository: Repository<FspQuestionEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private readonly lookupService: LookupService,
    private readonly actionService: ActionService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly programService: ProgramService,
    private readonly userService: UserService,
    private readonly fileImportService: FileImportService,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly eventsService: EventsService,
    private readonly queueRegistrationUpdateService: QueueRegistrationUpdateService,
  ) {}

  public async patchBulk(
    csvFile: any,
    programId: number,
    userId: number,
  ): Promise<void> {
    const maxRecords = 100000;
    const bulkUpdateRecords = await this.fileImportService.validateCsv(
      csvFile,
      maxRecords,
    );
    const columnNames = Object.keys(bulkUpdateRecords[0]);
    const validatedRegistrations = await this.validateBulkUpdateCsvInput(
      bulkUpdateRecords,
      programId,
      userId,
    );

    // Filter out only columns that were in the original csv
    const filteredRegistrations = validatedRegistrations.map((registration) => {
      const filteredRegistration = {};
      for (const key of columnNames) {
        if (key in registration) {
          filteredRegistration[key] = registration[key];
        }
      }
      return filteredRegistration;
    });

    // Add all to queue
    for (const registration of filteredRegistrations) {
      const updateData = { ...registration };
      delete updateData['referenceId'];
      const updateJob: RegistrationUpdateJobDto = {
        referenceId: registration['referenceId'],
        data: updateData,
        programId: programId,
      };
      await this.queueRegistrationUpdateService.addRegistrationUpdateToQueue(
        updateJob,
      );
    }
  }

  public async importBulkAsImported(
    csvFile,
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedBulkImport(
      csvFile,
      program.id,
      userId,
    );
    let countImported = 0;
    let countExistingPhoneNr = 0;
    let countInvalidPhoneNr = 0;

    const programCustomAttributes = program.programCustomAttributes;
    const dataArray = [];
    const savedRegistrations = [];

    const importResponseRecords = [];
    for await (const record of validatedImportRecords) {
      const importResponseRecord = record as BulkImportResult;
      const throwNoException = true;

      const phoneNumberResult = await this.lookupService.lookupAndCorrect(
        record.phoneNumber,
        throwNoException,
      );
      if (!phoneNumberResult) {
        importResponseRecord.importStatus = ImportStatus.invalidPhoneNumber;
        importResponseRecord.registrationStatus = '';
        importResponseRecords.push(importResponseRecord);
        countInvalidPhoneNr += 1;
        continue;
      }

      // Keep this on non-scoped repo as you do not want duplicates outside scope!
      const existingRegistrations = await this.registrationRepository.findOne({
        where: {
          phoneNumber: phoneNumberResult,
          programId: program.id,
        },
      });
      if (existingRegistrations) {
        importResponseRecord.importStatus = ImportStatus.existingPhoneNumber;
        importResponseRecord.registrationStatus =
          existingRegistrations.registrationStatus;
        importResponseRecords.push(importResponseRecord);
        countExistingPhoneNr += 1;
        continue;
      }

      importResponseRecord.importStatus = ImportStatus.imported;
      importResponseRecord.registrationStatus = RegistrationStatusEnum.imported;
      importResponseRecords.push(importResponseRecord);
      countImported += 1;

      const newRegistration = new RegistrationEntity();
      newRegistration.referenceId = uuid();
      newRegistration.phoneNumber = phoneNumberResult;
      newRegistration.preferredLanguage =
        importResponseRecord.preferredLanguage;
      newRegistration.program = program;
      if (!program.paymentAmountMultiplierFormula) {
        newRegistration.paymentAmountMultiplier =
          record.paymentAmountMultiplier || 1;
      }
      if (program.enableMaxPayments) {
        newRegistration.maxPayments = record.maxPayments;
      }
      if (program.enableScope) {
        newRegistration.scope = record.scope || '';
      }
      newRegistration.registrationStatus = RegistrationStatusEnum.imported;

      const savedRegistration =
        await this.registrationUtilsService.save(newRegistration);
      savedRegistrations.push(savedRegistration);

      for (const att of programCustomAttributes) {
        if (!att.name || !record[att.name]) {
          continue;
        }

        const data = new RegistrationDataEntity();

        data.value =
          att.type === CustomAttributeType.boolean
            ? this.stringToBoolean(record[att.name], false)
            : record[att.name];
        data.programCustomAttribute = att;
        data.registrationId = savedRegistration.id;
        dataArray.push(data);
      }
    }
    // Save registration status changes seperately without the registration.subscriber for better performance
    await this.eventsService.log(
      savedRegistrations.map((r) => ({
        id: r.id,
        status: null,
      })),
      savedRegistrations.map((r) => ({
        id: r.id,
        status: r.registrationStatus,
      })),
      { registrationAttributes: ['status'] },
    );
    // Save registration data in bulk for performance
    await this.registrationDataScopedRepository.save(dataArray, {
      chunk: 5000,
    });
    await this.actionService.saveAction(
      userId,
      program.id,
      AdditionalActionType.importPeopleAffected,
    );

    return {
      importResult: importResponseRecords,
      aggregateImportResult: {
        countExistingPhoneNr,
        countImported,
        countInvalidPhoneNr,
      },
    };
  }

  private stringToBoolean(string: string, defaultValue?: boolean): boolean {
    if (typeof string === 'boolean') {
      return string;
    }
    if (string === undefined) {
      return this.isValueUndefinedOrNull(defaultValue)
        ? undefined
        : defaultValue;
    }
    switch (string.toLowerCase().trim()) {
      case 'true':
      case 'yes':
      case '1':
        return true;
      case 'false':
      case 'no':
      case '0':
      case '':
      case null:
        return false;
      default:
        return this.isValueUndefinedOrNull(defaultValue)
          ? undefined
          : defaultValue;
    }
  }

  private isValueUndefinedOrNull(value: any): boolean {
    return value === undefined || value === null;
  }

  public async getImportRegistrationsTemplate(
    programId: number,
    type: ImportType,
  ): Promise<string[]> {
    let genericAttributes: string[];
    let dynamicAttributes: string[];

    if (type === ImportType.registered) {
      genericAttributes = [
        GenericAttributes.referenceId,
        GenericAttributes.fspName,
        GenericAttributes.phoneNumber,
        GenericAttributes.preferredLanguage,
      ].map((item) => String(item));
      dynamicAttributes = (await this.getDynamicAttributes(programId)).map(
        (d) => d.name,
      );
    } else if (type === ImportType.imported) {
      genericAttributes = [
        GenericAttributes.phoneNumber,
        GenericAttributes.preferredLanguage,
      ].map((item) => String(item));
      dynamicAttributes = (
        await this.getProgramCustomAttributes(programId)
      ).map((d) => d.name);
    }

    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    // If paymentAmountMultiplier automatic, then drop from template
    if (!program.paymentAmountMultiplierFormula) {
      genericAttributes.push(String(GenericAttributes.paymentAmountMultiplier));
    }
    if (program.enableMaxPayments) {
      genericAttributes.push(String(GenericAttributes.maxPayments));
    }
    if (program.enableScope) {
      genericAttributes.push(String(GenericAttributes.scope));
    }

    const attributes = genericAttributes.concat(dynamicAttributes);
    return [...new Set(attributes)]; // Deduplicates attributes
  }

  public async importRegistrations(
    csvFile,
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedRegistrations(
      csvFile,
      program.id,
      userId,
    );
    return await this.importValidatedRegistrations(
      validatedImportRecords,
      program,
      userId,
    );
  }

  public async importValidatedRegistrations(
    validatedImportRecords: ImportRegistrationsDto[],
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    let countImported = 0;
    const registrations: RegistrationEntity[] = [];
    const customDataList = [];

    const dynamicAttributes = await this.getDynamicAttributes(program.id);
    for await (const record of validatedImportRecords) {
      const registration = new RegistrationEntity();
      registration.referenceId = record.referenceId || uuid();
      registration.phoneNumber = record.phoneNumber;
      registration.preferredLanguage = record.preferredLanguage;
      registration.program = program;
      registration.inclusionScore = 0;
      registration.registrationStatus = RegistrationStatusEnum.registered;
      const customData = {};
      if (!program.paymentAmountMultiplierFormula) {
        registration.paymentAmountMultiplier =
          record.paymentAmountMultiplier || 1;
      }
      if (program.enableMaxPayments) {
        registration.maxPayments = record.maxPayments;
      }
      if (program.enableScope) {
        registration.scope = record.scope || '';
      }
      for await (const att of dynamicAttributes) {
        if (att.type === CustomAttributeType.boolean) {
          customData[att.name] = this.stringToBoolean(record[att.name], false);
        } else {
          customData[att.name] = record[att.name];
        }
      }
      const fsp = await this.fspRepository.findOne({
        where: { fsp: record.fspName },
      });
      registration.fsp = fsp;
      registrations.push(registration);
      customDataList.push(customData);
    }

    // Save registrations using .save to properly set registrationProgramId
    const savedRegistrations = [];
    for await (const registration of registrations) {
      const savedRegistration =
        await this.registrationUtilsService.save(registration);
      savedRegistrations.push(savedRegistration);
    }

    // Save registration status change events they changed from null to registered
    await this.eventsService.log(
      savedRegistrations.map((r) => ({
        id: r.id,
        status: null,
      })),
      savedRegistrations.map((r) => ({
        id: r.id,
        status: r.registrationStatus,
      })),
      { registrationAttributes: ['status'] },
    );

    // Save registration data in bulk for performance
    const dynamicAttributeRelations =
      await this.programService.getAllRelationProgram(program.id);
    let registrationDataArrayAllPa: RegistrationDataEntity[] = [];
    for (const [i, registration] of savedRegistrations.entries()) {
      const registrationDataArray = this.prepareRegistrationData(
        registration,
        customDataList[i],
        dynamicAttributeRelations,
      );
      registrationDataArrayAllPa = registrationDataArrayAllPa.concat(
        registrationDataArray,
      );
      countImported += 1;
    }
    await this.registrationDataScopedRepository.save(
      registrationDataArrayAllPa,
      {
        chunk: 5000,
      },
    );

    // Store inclusion score and paymentAmountMultiplierFormula if it's relevant
    const programHasScore = await this.programHasInclusionScore(program.id);
    for await (const registration of savedRegistrations) {
      if (programHasScore) {
        await this.inclusionScoreService.calculateInclusionScore(
          registration.referenceId,
        );
      }
      if (program.paymentAmountMultiplierFormula) {
        await this.inclusionScoreService.calculatePaymentAmountMultiplier(
          program,
          registration.referenceId,
        );
      }
    }
    await this.actionService.saveAction(
      userId,
      program.id,
      AdditionalActionType.importRegistrations,
    );

    return { aggregateImportResult: { countImported } };
  }

  private async programHasInclusionScore(programId: number): Promise<boolean> {
    const programQuestions = await this.programQuestionRepository.find({
      where: {
        programId: programId,
      },
    });
    for (const q of programQuestions) {
      if (q.scoring != null && JSON.stringify(q.scoring) !== '{}') {
        return true;
      }
    }
    return false;
  }

  private prepareRegistrationData(
    registration: RegistrationEntity,
    customData: object,
    dynamicAttributeRelations: RegistrationDataInfo[],
  ): RegistrationDataEntity[] {
    const registrationDataArray: RegistrationDataEntity[] = [];
    for (const att of dynamicAttributeRelations) {
      if (att.relation.fspQuestionId && att.fspId !== registration.fspId) {
        continue;
      }
      let values = [];
      if (att.type === CustomAttributeType.boolean) {
        values.push(this.stringToBoolean(customData[att.name], false));
      } else if (att.type === CustomAttributeType.text) {
        values.push(customData[att.name] ? customData[att.name] : '');
      } else if (att.type === AnswerTypes.multiSelect) {
        values = customData[att.name].split('|');
      } else {
        values.push(customData[att.name]);
      }
      for (const value of values) {
        const registrationData = new RegistrationDataEntity();
        registrationData.registration = registration;
        registrationData.value = value;
        registrationData.programCustomAttributeId =
          att.relation.programCustomAttributeId;
        registrationData.programQuestionId = att.relation.programQuestionId;
        registrationData.fspQuestionId = att.relation.fspQuestionId;
        registrationDataArray.push(registrationData);
      }
    }
    return registrationDataArray;
  }

  private async csvToValidatedBulkImport(
    csvFile,
    programId: number,
    userId: number,
  ): Promise<BulkImportDto[]> {
    const maxRecords = 1000;
    const importRecords = await this.fileImportService.validateCsv(
      csvFile,
      maxRecords,
    );
    return await this.validateImportAsImportedCsvInput(
      importRecords,
      programId,
      userId,
    );
  }

  private async csvToValidatedRegistrations(
    csvFile: any[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const maxRecords = 1000;
    const importRecords = await this.fileImportService.validateCsv(
      csvFile,
      maxRecords,
    );
    return await this.validateImportAsRegisteredInput(
      importRecords,
      programId,
      userId,
    );
  }

  private recordHasAllowedScope(record: any, userScope: string): boolean {
    return (
      (userScope &&
        record[AdditionalAttributes.scope]?.startsWith(userScope)) ||
      !userScope
    );
  }

  private async getProgramCustomAttributes(
    programId: number,
  ): Promise<Attribute[]> {
    return (
      await this.programCustomAttributeRepository.find({
        where: { program: { id: programId } },
      })
    ).map((c) => {
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        label: c.label,
        questionType: QuestionType.programCustomAttribute,
      };
    });
  }

  private async getDynamicAttributes(programId: number): Promise<Attribute[]> {
    let attributes = [];
    const programCustomAttributes =
      await this.getProgramCustomAttributes(programId);
    attributes = [...attributes, ...programCustomAttributes];

    const programQuestions = (
      await this.programQuestionRepository.find({
        where: { program: { id: programId } },
      })
    ).map((c) => {
      return {
        id: c.id,
        name: c.name,
        type: c.answerType,
        questionType: QuestionType.programQuestion,
      };
    });
    attributes = [...attributes, ...programQuestions];

    const fspAttributes = await this.fspAttributeRepository.find({
      relations: ['fsp', 'fsp.program'],
    });
    const programFspAttributes = fspAttributes
      .filter((a) => a.fsp.program.map((p) => p.id).includes(programId))
      .map((c) => {
        return {
          id: c.id,
          name: c.name,
          type: c.answerType,
          fspName: c.fsp.fsp,
          questionType: QuestionType.fspQuestion,
        };
      });
    attributes = [...programFspAttributes.reverse(), ...attributes];

    // deduplicate attributes and concatenate fsp names
    const deduplicatedAttributes = attributes.reduce((acc, curr) => {
      const existingAttribute = acc.find((a) => a.name === curr.name);
      if (existingAttribute) {
        if (
          curr.questionType &&
          !existingAttribute.questionTypes.includes(curr.questionType)
        ) {
          existingAttribute.questionTypes.push(curr.questionType);
        }
        if (curr.fspName) {
          existingAttribute.fspNames.push(curr.fspName);
        }
      } else {
        acc.push({
          id: curr.id,
          name: curr.name,
          type: curr.type,
          fspNames: curr.fspName ? [curr.fspName] : [],
          questionTypes: curr.questionType ? [curr.questionType] : [],
        });
      }
      return acc;
    }, []);
    return deduplicatedAttributes;
  }

  private async validateImportAsImportedCsvInput(
    csvArray: any[],
    programId: number,
    userId: number,
  ): Promise<BulkImportDto[]> {
    const validationConfig = new ValidationConfigDto();
    validationConfig.validatePhoneNumberEmpty = true;
    validationConfig.validatePhoneNumberLookup = true;
    validationConfig.validateClassValidator = true;
    validationConfig.validateUniqueReferenceId = false;
    validationConfig.validateScope = true;
    validationConfig.validatePreferredLanguage = true;
    validationConfig.validateDynamicAttributes = false;

    return await this.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      RegistrationCsvValidationEnum.importAsImport,
      validationConfig,
    );
  }

  public async validateImportAsRegisteredInput(
    csvArray: any[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const program = await this.programService.findProgramOrThrow(programId);
    const validationConfig = new ValidationConfigDto();
    validationConfig.validatePhoneNumberEmpty = !program.allowEmptyPhoneNumber;
    validationConfig.validatePhoneNumberLookup = true;
    validationConfig.validateClassValidator = true;
    validationConfig.validateUniqueReferenceId = true;
    validationConfig.validateScope = true;
    validationConfig.validatePreferredLanguage = true;
    validationConfig.validateDynamicAttributes = true;

    return (await this.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      RegistrationCsvValidationEnum.importAsRegistered,
      validationConfig,
    )) as ImportRegistrationsDto[];
  }

  private async validateBulkUpdateCsvInput(
    csvArray: any[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const program = await this.programService.findProgramOrThrow(programId);
    const validationConfig = new ValidationConfigDto();
    validationConfig.validateReferenceId = false;
    validationConfig.validatePhoneNumberEmpty = !program.allowEmptyPhoneNumber;
    validationConfig.validatePhoneNumberLookup = true;
    validationConfig.validateClassValidator = true;
    validationConfig.validateUniqueReferenceId = false;
    validationConfig.validateScope = true;
    validationConfig.validatePreferredLanguage = true;
    validationConfig.validateDynamicAttributes = true;

    return (await this.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      RegistrationCsvValidationEnum.importAsImport,
      validationConfig,
    )) as ImportRegistrationsDto[];
  }

  public async validateAndCleanRegistrationsInput(
    csvArray: any[],
    programId: number,
    userId: number,
    typeOfInput: RegistrationCsvValidationEnum,
    validationConfig: ValidationConfigDto = new ValidationConfigDto(),
  ): Promise<ImportRegistrationsDto[] | BulkImportDto[]> {
    let phoneNumberLookupResults: { [key: string]: string } = {};

    const errors = [];

    const userScope = await this.userService.getUserScopeForProgram(
      userId,
      programId,
    );

    if (validationConfig.validateUniqueReferenceId) {
      this.validateUniqueReferenceIds(csvArray);
    }

    const dynamicAttributes = await this.getDynamicAttributes(programId);
    const program = await this.programRepository.findOneBy({
      id: programId,
    });

    const languageMapping = this.createLanguageMapping(
      program.languages as unknown as string[],
    );

    const validatedArray = [];
    for (const [i, row] of csvArray.entries()) {
      let importRecord;
      if (typeOfInput === RegistrationCsvValidationEnum.importAsRegistered) {
        importRecord = new ImportRegistrationsDto();
      } else if (typeOfInput === RegistrationCsvValidationEnum.importAsImport) {
        importRecord = new BulkImportDto();
      } else if (typeOfInput === RegistrationCsvValidationEnum.bulkUpdate) {
        importRecord = new BulkUpdateDto();
      }

      /*
       * =============================================================
       * Add default registration attributes without custom validation
       * =============================================================
       */

      importRecord.fspName = row.fspName;
      if (!program.paymentAmountMultiplierFormula) {
        importRecord.paymentAmountMultiplier = row.paymentAmountMultiplier
          ? +row.paymentAmountMultiplier
          : null;
      }
      if (program.enableMaxPayments) {
        importRecord.maxPayments = row.maxPayments ? +row.maxPayments : null;
      }

      /*
       * ========================================
       * Validate default registration attributes
       * ========================================
       */
      if (this.fileImportService.checkForCompletelyEmptyRow(row)) {
        continue;
      }

      const errorObjScope = this.validateRowScope(
        row,
        userScope,
        i,
        validationConfig,
      );
      if (errorObjScope) {
        errors.push(errorObjScope);
      }

      if (program.enableScope) {
        importRecord.scope = row[AdditionalAttributes.scope];
      }
      importRecord.referenceId = row.referenceId;

      const { errorObj: errorObjLanguage, preferredLanguage: _ } =
        this.validatePreferredLanguage(
          row.preferredLanguage,
          languageMapping,
          i,
          validationConfig,
        );
      if (errorObjLanguage) {
        errors.push(errorObjLanguage);
      }
      importRecord.preferredLanguage = this.updateLanguage(
        row.preferredLanguage,
        languageMapping,
      );

      const errorObjReferenceId = await this.validateReferenceId(
        row,
        i,
        validationConfig,
      );
      if (errorObjReferenceId) {
        errors.push(errorObjReferenceId);
      }
      importRecord.referenceId = row.referenceId;

      const errorObj = this.validatePhoneNumber(row, i, validationConfig);
      if (errorObj) {
        errors.push(errorObj);
      }

      /*
       * =============================================
       * Validate dynamic registration data attributes
       * =============================================
       */

      // Filter dynamic atttributes that are not relevant for this fsp if question is only fsp specific
      const dynamicAttributesForFsp = dynamicAttributes.filter((att) =>
        this.isDynamicAttributeForFsp(att, row.fspName),
      );

      for await (const att of dynamicAttributesForFsp) {
        if (
          att.type === AnswerTypes.tel &&
          row[att.name] &&
          validationConfig.validatePhoneNumberLookup
        ) {
          const { errorObj, sanitized } =
            await this.validateSanitizePhoneNumber(
              row[att.name],
              i,
              phoneNumberLookupResults,
            );
          if (errorObj) {
            errors.push(errorObj);
          } else {
            phoneNumberLookupResults[row[att.name]] = sanitized;
            importRecord[att.name] = sanitized;
          }
        } else if (validationConfig.validateDynamicAttributes) {
          const errorObj = this.validateNumericOrBoolean(
            row[att.name],
            att.type,
            att.name,
            i,
          );
          if (errorObj) {
            errors.push(errorObj);
          } else {
            importRecord[att.name] = row[att.name];
          }
        }

        if (validationConfig.validateClassValidator) {
          const result = await validate(importRecord);
          if (result.length > 0) {
            const errorObj = {
              lineNumber: i + 1,
              column: result[0].property,
              value: result[0].value,
              error: result[0]?.constraints,
            };
            errors.push(errorObj);
          }
        }
      }
      validatedArray.push(importRecord);
    }

    // Throw all found errors at once
    if (errors.length > 0) {
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }
    return validatedArray;
  }

  private async validateSanitizePhoneNumber(
    value: string,
    i: number,
    phoneNumberLookupResults: { [key: string]: string },
  ): Promise<{
    errorObj: ValidateRegistrationErrorObjectDto;
    sanitized: string;
  }> {
    let sanitized: string;
    if (phoneNumberLookupResults[value]) {
      sanitized = phoneNumberLookupResults[value];
    } else {
      sanitized = await this.lookupService.lookupAndCorrect(value, true);
    }
    if (!sanitized && !!value) {
      const errorObj = {
        lineNumber: i + 1,
        column: 'phoneNumber',
        value: value,
        error: 'PhoneNumber is not valid according to Twilio lookup',
      };
      return { errorObj, sanitized };
    }
    return { errorObj: undefined, sanitized };
  }

  private validateNumericOrBoolean(
    value: string,
    type: string,
    columnName: string,
    i: number,
  ): ValidateRegistrationErrorObjectDto {
    const cleanedValue = this.cleanNumericOrBoolean(value, type);
    if (cleanedValue === null) {
      const errorObj = {
        lineNumber: i + 1,
        column: columnName,
        value: value,
        error: `Value is not a valid ${type}`,
      };
      return errorObj;
    }
  }

  private cleanNumericOrBoolean(value: string, type: string) {
    if (type === AnswerTypes.numeric) {
      // Convert the value to a number and return it
      // If the value is not a number, return null
      return isNaN(Number(value)) ? null : Number(value);
    } else if (type === CustomAttributeType.boolean) {
      // Convert the value to a boolean and return it
      // If the value is not a boolean, return null
      return this.stringToBoolean(value) === undefined
        ? null
        : this.stringToBoolean(value);
    }
    // If the type is neither numeric nor boolean, return the original value
    return value;
  }

  private validateUniqueReferenceIds(csvArray: any[]): void {
    const allReferenceIds = csvArray
      .filter((row) => row.referenceId)
      .map((row) => row.referenceId);
    const uniqueReferenceIds = [...new Set(allReferenceIds)];
    if (uniqueReferenceIds.length < allReferenceIds.length) {
      throw new HttpException(
        'Duplicate referenceIds in import set',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateRowScope(
    row: any,
    userScope: string,
    i: number,
    validationConfig: ValidationConfigDto,
  ): ValidateRegistrationErrorObjectDto {
    if (validationConfig.validateScope) {
      const correctScope = this.recordHasAllowedScope(row, userScope);
      if (!correctScope) {
        return {
          lineNumber: i + 1,
          column: AdditionalAttributes.scope,
          value: row[AdditionalAttributes.scope],
          error: `User has program scope ${userScope} and does not have access to registration scope ${
            row[AdditionalAttributes.scope]
          }`,
        };
      }
    }
  }

  private async validateReferenceId(
    row: any,
    i: number,
    validationConfig: ValidationConfigDto,
  ): Promise<ValidateRegistrationErrorObjectDto> {
    if (validationConfig.validateReferenceId && row.referenceId) {
      const registration = await this.registrationRepository.findOne({
        where: { referenceId: row.referenceId },
      });
      if (registration) {
        return {
          lineNumber: i + 1,
          column: GenericAttributes.referenceId,
          value: row.referenceId,
          error: 'referenceId already exists in database',
        };
      }
    }
  }

  private validatePhoneNumber(
    row: any,
    i: number,
    validationConfig: ValidationConfigDto,
  ): ValidateRegistrationErrorObjectDto {
    if (!row.phoneNumber && validationConfig.validatePhoneNumberEmpty) {
      return {
        lineNumber: i + 1,
        column: GenericAttributes.phoneNumber,
        value: row.phoneNumber,
        error: 'PhoneNumber is not allowed to be empty',
      };
    }
  }

  private isDynamicAttributeForFsp(
    attribute: Attribute,
    fspName: FspName,
  ): boolean {
    // If the CSV does not have fspName all attributes may be relevant because a bulk PATCH may be for multiple FSPs
    if (!fspName) {
      return true;
    }
    if (
      attribute.questionTypes.length > 1 ||
      attribute.questionTypes[0] !== QuestionType.fspQuestion
    ) {
      // The attribute has multiple question types or is not FSP-specific
      return true;
    } else if (
      attribute.questionTypes.length === 1 &&
      attribute.questionTypes[0] === QuestionType.fspQuestion &&
      attribute.fspNames.includes(fspName)
    ) {
      // The attribute has a single question type that is FSP-specific and is relevant for the FSP of this registration
      return true;
    } else {
      // The attribute is not relevant
      return false;
    }
  }

  private createLanguageMapping(programLanguages: string[]): object {
    const languageNamesApi = new Intl.DisplayNames(['en'], {
      type: 'language',
    });
    const mapping = {};
    for (const languageAbbr of programLanguages) {
      const fullNameLanguage = languageNamesApi.of(
        languageAbbr.substring(0, 2),
      );
      const cleanedFullNameLanguage = fullNameLanguage.trim().toLowerCase();
      mapping[cleanedFullNameLanguage] = languageAbbr;
    }
    return mapping;
  }

  private validatePreferredLanguage(
    preferredLanguage: string,
    languageMapping: any,
    i: number,
    validationConfig: ValidationConfigDto = new ValidationConfigDto(),
  ): {
    errorObj: ValidateRegistrationErrorObjectDto;
    preferredLanguage: LanguageEnum;
  } {
    if (validationConfig.validatePreferredLanguage) {
      const cleanedPreferredLanguage =
        typeof preferredLanguage === 'string'
          ? preferredLanguage.trim().toLowerCase()
          : preferredLanguage;

      const errorObj = this.checkLanguage(
        cleanedPreferredLanguage,
        languageMapping,
        i,
      );

      if (errorObj) {
        return { errorObj, preferredLanguage: undefined };
      } else {
        const value = this.updateLanguage(
          cleanedPreferredLanguage,
          languageMapping,
        );
        return { errorObj: undefined, preferredLanguage: value };
      }
    }
    return {
      errorObj: undefined,
      preferredLanguage: preferredLanguage as LanguageEnum,
    };
  }

  private checkLanguage(
    inPreferredLanguage: string,
    programLanguageMapping: object,
    i: number,
  ): ValidateRegistrationErrorObjectDto | undefined {
    const cleanedPreferredLanguage =
      typeof inPreferredLanguage === 'string'
        ? inPreferredLanguage.trim().toLowerCase()
        : inPreferredLanguage;
    if (!cleanedPreferredLanguage) {
      return;
    } else if (
      !Object.keys(programLanguageMapping).includes(cleanedPreferredLanguage) &&
      !Object.values(programLanguageMapping).some(
        (x) => x.toLowerCase() == cleanedPreferredLanguage.toLowerCase(),
      )
    ) {
      return {
        lineNumber: i + 1,
        column: AdditionalAttributes.preferredLanguage,
        value: inPreferredLanguage,
        error: `Language error: Allowed values of this program for preferredLanguage: ${Object.values(
          programLanguageMapping,
        ).join(', ')}, ${Object.keys(programLanguageMapping).join(', ')}`,
      };
    }
  }

  private updateLanguage(
    inPreferredLanguage: string,
    programLanguageMapping: object,
  ): LanguageEnum {
    const cleanedPreferredLanguage =
      typeof inPreferredLanguage === 'string'
        ? inPreferredLanguage.trim().toLowerCase()
        : inPreferredLanguage;
    if (!cleanedPreferredLanguage) {
      return LanguageEnum.en;
    } else if (
      Object.keys(programLanguageMapping).includes(cleanedPreferredLanguage)
    ) {
      return programLanguageMapping[cleanedPreferredLanguage];
    } else if (
      Object.values(programLanguageMapping).some(
        (x) => x.toLowerCase() == cleanedPreferredLanguage.toLowerCase(),
      )
    ) {
      for (const value of Object.values(programLanguageMapping)) {
        if (value.toLowerCase() === cleanedPreferredLanguage) {
          return value;
        }
      }
    }
  }
}
