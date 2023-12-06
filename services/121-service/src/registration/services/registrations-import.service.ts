import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import * as convert from 'xml-js';
import { AdditionalActionType } from '../../actions/action.entity';
import { ActionService } from '../../actions/action.service';
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../../fsp/fsp-question.entity';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { CustomAttributeType } from '../../programs/dto/create-program-custom-attribute.dto';
import { ProgramCustomAttributeEntity } from '../../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../../programs/program-question.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { ProgramService } from '../../programs/programs.service';
import {
  BulkImportDto,
  BulkImportResult,
  ImportRegistrationsDto,
  ImportResult,
  ImportStatus,
} from '../dto/bulk-import.dto';
import { RegistrationDataInfo } from '../dto/registration-data-relation.model';
import { AdditionalAttributes } from '../dto/update-registration.dto';
import {
  AnswerTypes,
  Attribute,
  GenericAttributes,
  QuestionType,
} from '../enum/custom-data-attributes';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { RegistrationDataEntity } from '../registration-data.entity';
import { RegistrationStatusChangeEntity } from '../registration-status-change.entity';
import { RegistrationEntity } from '../registration.entity';
import { InclusionScoreService } from './inclusion-score.service';
import { UserService } from '../../user/user.service';

export enum ImportType {
  imported = 'import-as-imported',
  registered = 'import-as-registered',
}

@Injectable()
export class RegistrationsImportService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationStatusChangeEntity)
  private readonly registrationStatusRepository: Repository<RegistrationStatusChangeEntity>;
  @InjectRepository(RegistrationDataEntity)
  private readonly registrationDataRepository: Repository<RegistrationDataEntity>;
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

  public constructor(
    private readonly lookupService: LookupService,
    private readonly actionService: ActionService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly programService: ProgramService,
    private readonly userService: UserService,
  ) {}

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

      // TODO: keep this on non-scoped repo as you do not want duplicates outside scope?
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

      const savedRegistration = await newRegistration.save();
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
    await this.saveBulkRegistrationStatusChanges(
      savedRegistrations,
      RegistrationStatusEnum.imported,
    );
    // Save registration data in bulk for performance
    await this.registrationDataRepository.save(dataArray, {
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
    if (!!program.paymentAmountMultiplierFormula) {
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
    );
  }

  public async importValidatedRegistrations(
    validatedImportRecords: ImportRegistrationsDto[],
    program: ProgramEntity,
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
      savedRegistrations.push(await registration.save());
    }

    // Save registration status changes seperately without the registration.subscriber for better performance
    await this.saveBulkRegistrationStatusChanges(
      savedRegistrations,
      RegistrationStatusEnum.registered,
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
    await this.registrationDataRepository.save(registrationDataArrayAllPa, {
      chunk: 5000,
    });

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
    return { aggregateImportResult: { countImported } };
  }

  private async saveBulkRegistrationStatusChanges(
    savedRegistrations: RegistrationEntity[],
    registrationStatus: RegistrationStatusEnum,
  ): Promise<void> {
    const registrationStatusChanges: RegistrationStatusChangeEntity[] = [];
    for await (const registration of savedRegistrations) {
      const registrationStatusChange = new RegistrationStatusChangeEntity();
      registrationStatusChange.registration = registration;
      registrationStatusChange.registrationStatus = registrationStatus;
      registrationStatusChanges.push(registrationStatusChange);
    }

    await this.registrationStatusRepository.save(registrationStatusChanges, {
      chunk: 5000,
    });
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
    const importRecords = await this.validateCsv(csvFile);
    return await this.validateBulkImportCsvInput(
      importRecords,
      programId,
      userId,
    );
  }

  private async csvToValidatedRegistrations(
    csvFile,
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const importRecords = await this.validateCsv(csvFile);
    return await this.validateRegistrationsInput(
      importRecords,
      programId,
      userId,
    );
  }

  public async validateCsv(csvFile): Promise<object[]> {
    const indexLastPoint = csvFile.originalname.lastIndexOf('.');
    const extension = csvFile.originalname.substr(
      indexLastPoint,
      csvFile.originalname.length - indexLastPoint,
    );
    if (extension !== '.csv') {
      const errors = [`Wrong file extension. It should be .csv`];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    let importRecords = await this.csvBufferToArray(csvFile.buffer, ',');
    if (Object.keys(importRecords[0]).length === 1) {
      importRecords = await this.csvBufferToArray(csvFile.buffer, ';');
    }

    const maxRecords = 1000;
    if (importRecords.length > maxRecords) {
      const errors = [
        `Too many records. Maximum number of records is ${maxRecords}. You have ${importRecords.length} records.`,
      ];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }
    return importRecords;
  }

  public async validateXml(
    xmlFile,
  ): Promise<convert.Element | convert.ElementCompact> {
    const indexLastPoint = xmlFile.originalname.lastIndexOf('.');
    const extension = xmlFile.originalname.substr(
      indexLastPoint,
      xmlFile.originalname.length - indexLastPoint,
    );
    if (extension !== '.xml') {
      const errors = [`Wrong file extension. It should be .xml`];
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    const importRecords = await this.xmlBufferToArray(xmlFile.buffer);
    return importRecords;
  }

  private async csvBufferToArray(buffer, separator): Promise<object[]> {
    const stream = new Readable();
    stream.push(buffer.toString());
    stream.push(null);
    const parsedData = [];
    return await new Promise((resolve, reject): void => {
      stream
        .pipe(csv({ separator: separator }))
        .on('error', (error): void => reject(error))
        .on('data', (row): number => parsedData.push(row))
        .on('end', (): void => {
          resolve(parsedData);
        });
    });
  }

  private async xmlBufferToArray(
    buffer,
  ): Promise<convert.Element | convert.ElementCompact> {
    const xml = convert.xml2js(buffer.toString());
    return xml.elements[0].elements.find((el) => el.name === 'Records')
      .elements;
  }

  private recordHasAllowedScope(record: any, userScope: string): boolean {
    return (
      (userScope &&
        record[AdditionalAttributes.scope]?.startsWith(userScope)) ||
      !userScope
    );
  }

  public checkForCompletelyEmptyRow(row): boolean {
    if (Object.keys(row).every((key) => !row[key])) {
      return true;
    }
    return false;
  }

  private async validateBulkImportCsvInput(
    csvArray,
    programId: number,
    userId: number,
  ): Promise<BulkImportDto[]> {
    const errors = [];
    const validatatedArray = [];
    const programCustomAttributes =
      await this.getProgramCustomAttributes(programId);
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    const languageMapping = this.createLanguageMapping(
      program.languages as unknown as string[],
    );
    const userScope = await this.userService.getUserScopeForProgram(
      userId,
      programId,
    );

    for (const [i, row] of csvArray.entries()) {
      if (this.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      const importRecord = new BulkImportDto();
      importRecord.phoneNumber = row.phoneNumber;

      const correctScope = this.recordHasAllowedScope(row, userScope);
      if (correctScope) {
        importRecord.scope = row[AdditionalAttributes.scope];
      } else {
        const errorObj = {
          lineNumber: i + 1,
          column: AdditionalAttributes.scope,
          value: row[AdditionalAttributes.scope],
          error: `User has program scope ${userScope} and does not have access to registration scope ${
            row[AdditionalAttributes.scope]
          }`,
        };
        errors.push(errorObj);
      }

      const langResult = this.checkAndUpdateLanguage(
        row.preferredLanguage,
        languageMapping,
      );
      if (langResult.error) {
        const errorObj = {
          lineNumber: i + 1,
          column: AdditionalAttributes.preferredLanguage,
          value: row.preferredLanguage,
          error: langResult.error,
        };
        errors.push(errorObj);
      } else {
        importRecord.preferredLanguage = langResult.value;
      }
      if (!program.paymentAmountMultiplierFormula) {
        importRecord.paymentAmountMultiplier = row.paymentAmountMultiplier
          ? +row.paymentAmountMultiplier
          : null;
      }
      if (program.enableMaxPayments) {
        importRecord.maxPayments = row.maxPayments ? +row.maxPayments : null;
      }
      if (program.enableScope) {
        importRecord.scope = row.scope || '';
      }
      for await (const att of programCustomAttributes) {
        if (
          (att.type === AnswerTypes.numeric && isNaN(Number(row[att.name]))) ||
          (att.type === CustomAttributeType.boolean &&
            row[att.name] &&
            this.stringToBoolean(row[att.name]) === undefined)
        ) {
          const errorObj = {
            lineNumber: i + 1,
            column: att.name,
            value: row[att.name],
          };
          errors.push(errorObj);
        }
        importRecord[att.name] = row[att.name];
      }

      const result = await validate(importRecord);
      if (result.length > 0) {
        const errorObj = {
          lineNumber: i + 1,
          column: result[0].property,
          value: result[0].value,
        };
        errors.push(errorObj);
      }
      if (errors.length > 0) {
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      validatatedArray.push(importRecord);
    }
    return validatatedArray;
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

  public async validateRegistrationsInput(
    csvArray,
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const errors = [];
    const validatatedArray = [];

    const userScope = await this.userService.getUserScopeForProgram(
      userId,
      programId,
    );

    const allReferenceIds = csvArray
      .filter((row) => row.referenceId)
      .map((row) => row.referenceId);
    const uniqueReferenceIds = [...new Set(allReferenceIds)];
    if (uniqueReferenceIds.length < allReferenceIds.length) {
      const errorObj = {
        column: GenericAttributes.referenceId,
        error: 'Duplicate referenceIds in import set',
      };
      errors.push(errorObj);
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }

    const dynamicAttributes = await this.getDynamicAttributes(programId);
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    const languageMapping = this.createLanguageMapping(
      program.languages as unknown as string[],
    );
    for (const [i, row] of csvArray.entries()) {
      if (this.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      const importRecord = new ImportRegistrationsDto();
      const correctScope = this.recordHasAllowedScope(row, userScope);
      if (correctScope) {
        importRecord.scope = row[AdditionalAttributes.scope];
      } else {
        const errorObj = {
          lineNumber: i + 1,
          column: AdditionalAttributes.scope,
          value: row[AdditionalAttributes.scope],
          error: `User has program scope ${userScope} and does not have access to registration scope ${
            row[AdditionalAttributes.scope]
          }`,
        };
        errors.push(errorObj);
      }

      const langResult = this.checkAndUpdateLanguage(
        row.preferredLanguage,
        languageMapping,
      );
      if (langResult.error) {
        const errorObj = {
          lineNumber: i + 1,
          column: AdditionalAttributes.preferredLanguage,
          value: row.preferredLanguage,
          error: langResult.error,
        };
        errors.push(errorObj);
      } else {
        importRecord.preferredLanguage = langResult.value;
      }

      if (row.referenceId) {
        // TODO: keep this on non-scoped repo as you do not want duplicates outside scope?
        const registration = await this.registrationRepository.findOne({
          where: { referenceId: row.referenceId },
        });
        if (registration) {
          const errorObj = {
            lineNumber: i + 1,
            column: GenericAttributes.referenceId,
            value: row.referenceId,
            error: 'referenceId already exists in database',
          };
          errors.push(errorObj);
        } else {
          importRecord.referenceId = row.referenceId;
        }
      }
      importRecord.phoneNumber = row.phoneNumber;
      importRecord.fspName = row.fspName;
      if (!program.paymentAmountMultiplierFormula) {
        importRecord.paymentAmountMultiplier = row.paymentAmountMultiplier
          ? +row.paymentAmountMultiplier
          : null;
      }
      if (program.enableMaxPayments) {
        importRecord.maxPayments = row.maxPayments ? +row.maxPayments : null;
      }
      if (program.enableScope) {
        importRecord.scope = row.scope;
      }
      const earlierCheckedPhoneNr = {
        original: null,
        sanitized: null,
      };

      // Filter dynamic atttributes that are not relevant for this fsp if question is only fsp specific
      const dynamicAttributesForFsp = dynamicAttributes.filter((att) =>
        this.isDynamicAttributeForFsp(att, row.fspName),
      );

      for await (const att of dynamicAttributesForFsp) {
        if (att.type === AnswerTypes.tel && row[att.name]) {
          let sanitized: string;
          if (row[att.name] === earlierCheckedPhoneNr.original) {
            sanitized = earlierCheckedPhoneNr.sanitized;
          } else {
            sanitized = await this.lookupService.lookupAndCorrect(
              row[att.name],
              true,
            );
          }

          earlierCheckedPhoneNr.original = row[att.name];
          earlierCheckedPhoneNr.sanitized = sanitized;

          if (!sanitized && !!row[att.name]) {
            const errorObj = {
              lineNumber: i + 1,
              column: att.name,
              value: row[att.name],
            };
            errors.push(errorObj);
          }
          row[att.name] = sanitized;
        } else if (
          (att.type === AnswerTypes.numeric && isNaN(Number(row[att.name]))) ||
          (att.type === CustomAttributeType.boolean &&
            row[att.name] &&
            this.stringToBoolean(row[att.name]) === undefined)
        ) {
          const errorObj = {
            lineNumber: i + 1,
            column: att.name,
            value: row[att.name],
          };
          errors.push(errorObj);
        }
        importRecord[att.name] = row[att.name];
      }

      const result = await validate(importRecord);
      if (result.length > 0) {
        const errorObj = {
          lineNumber: i + 1,
          column: result[0].property,
          value: result[0].value,
        };
        errors.push(errorObj);
      }
      if (errors.length > 0) {
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      validatatedArray.push(importRecord);
    }
    return validatatedArray;
  }

  private isDynamicAttributeForFsp(
    attribute: Attribute,
    fspName: FspName,
  ): boolean {
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

  private checkAndUpdateLanguage(
    inPreferredLanguage: string,
    programLanguageMapping: object,
  ): {
    error: any;
    value: LanguageEnum;
  } {
    const result = { error: null, value: null };
    const cleanedPreferredLanguage =
      typeof inPreferredLanguage === 'string'
        ? inPreferredLanguage.trim().toLowerCase()
        : inPreferredLanguage;
    /// If preferredLanguage column does not exist or has no value set language to English
    if (!cleanedPreferredLanguage) {
      result.value = LanguageEnum.en;
    } else if (
      Object.keys(programLanguageMapping).includes(cleanedPreferredLanguage)
    ) {
      result.value = programLanguageMapping[cleanedPreferredLanguage];
    } else if (
      Object.values(programLanguageMapping).some(
        (x) => x.toLowerCase() == cleanedPreferredLanguage.toLowerCase(),
      )
    ) {
      for (const value of Object.values(programLanguageMapping)) {
        if (value.toLowerCase() === cleanedPreferredLanguage) {
          result.value = value;
        }
      }
    } else {
      result.error = `Language error: Allowed values of this program for preferredLanguage: ${Object.values(
        programLanguageMapping,
      ).join(', ')}, ${Object.keys(programLanguageMapping).join(', ')}`;
    }
    return result;
  }
}
