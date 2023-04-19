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
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../../fsp/fsp-question.entity';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { CustomAttributeType } from '../../programs/dto/create-program-custom-attribute.dto';
import { ProgramCustomAttributeEntity } from '../../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../../programs/program-question.entity';
import { ProgramEntity } from '../../programs/program.entity';
import {
  BulkImportDto,
  BulkImportResult,
  ImportRegistrationsDto,
  ImportResult,
  ImportStatus,
} from '../dto/bulk-import.dto';
import { RegistrationDataInfo } from '../dto/registration-data-relation.model';
import { AdditionalAttributes } from '../dto/update-attribute.dto';
import {
  AnswerTypes,
  Attribute,
  GenericAttributes,
} from '../enum/custom-data-attributes';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { RegistrationStatusChangeEntity } from '../registration-status-change.entity';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationDataEntity } from './../registration-data.entity';
import { InclusionScoreService } from './inclusion-score.service';

export enum ImportType {
  imported = 'import-as-imported',
  registered = 'import-as-registered',
}

@Injectable()
export class BulkImportService {
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
  ) {}

  public async importBulk(
    csvFile,
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedBulkImport(
      csvFile,
      program.id,
    );
    let countImported = 0;
    let countExistingPhoneNr = 0;
    let countInvalidPhoneNr = 0;

    const programCustomAttributes = program.programCustomAttributes;

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
      if (!program.paymentAmountMultiplierFormula) {
        newRegistration.paymentAmountMultiplier =
          record.paymentAmountMultiplier;
      }
      if (program.enableMaxPayments) {
        newRegistration.maxPayments = record.maxPayments;
      }
      newRegistration.program = program;

      const savedRegistration = await newRegistration.save();
      programCustomAttributes.forEach(async (att) => {
        if (record[att.name]) {
          const data = new RegistrationDataEntity();
          data.value =
            att.type === CustomAttributeType.boolean
              ? this.stringToBoolean(record[att.name], false)
              : record[att.name];
          data.programCustomAttribute = att;
          data.registrationId = savedRegistration.id;
          await this.registrationDataRepository.save(data);
        }
      });

      // Save already before status change, otherwise 'registration.subscriber' does not work
      savedRegistration.registrationStatus = RegistrationStatusEnum.imported;
      await this.registrationRepository.save(savedRegistration);
    }
    this.actionService.saveAction(
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
      return this.isValueUdefinedOrNull(defaultValue)
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
        return this.isValueUdefinedOrNull(defaultValue)
          ? undefined
          : defaultValue;
    }
  }

  private isValueUdefinedOrNull(value: any): boolean {
    return value === undefined || value === null;
  }

  public async getImportRegistrationsTemplate(
    programId: number,
    type: ImportType,
  ): Promise<string[]> {
    let genericAttributes: string[];
    let dynamicAttributes: string[];

    if (type === ImportType.registered) {
      genericAttributes = Object.values(GenericAttributes).map((item) =>
        String(item),
      );
      dynamicAttributes = (await this.getDynamicAttributes(programId)).map(
        (d) => d.name,
      );
    } else if (type === ImportType.imported) {
      genericAttributes = [
        GenericAttributes.phoneNumber,
        GenericAttributes.paymentAmountMultiplier,
        GenericAttributes.maxPayments,
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
      const index = genericAttributes.indexOf(
        GenericAttributes.paymentAmountMultiplier,
      );
      if (index > -1) {
        genericAttributes.splice(index, 1);
      }
    }
    // If maxPayments not enabled, then drop from template
    if (!program.enableMaxPayments) {
      const index = genericAttributes.indexOf(GenericAttributes.maxPayments);
      if (index > -1) {
        genericAttributes.splice(index, 1);
      }
    }

    const attributes = genericAttributes.concat(dynamicAttributes);
    return [...new Set(attributes)]; // Deduplicates attributes
  }

  public async importRegistrations(
    csvFile,
    program: ProgramEntity,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedRegistrations(
      csvFile,
      program.id,
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
        registration.paymentAmountMultiplier = record.paymentAmountMultiplier;
      }
      if (program.enableMaxPayments) {
        registration.maxPayments = record.maxPayments;
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
    const registrationStatusChanges: RegistrationStatusChangeEntity[] = [];
    for await (const registration of savedRegistrations) {
      const registrationStatusChange = new RegistrationStatusChangeEntity();
      registrationStatusChange.registration = registration;
      registrationStatusChange.registrationStatus =
        RegistrationStatusEnum.registered;
      registrationStatusChanges.push(registrationStatusChange);
    }
    this.registrationStatusRepository.save(registrationStatusChanges, {
      chunk: 5000,
    });

    // Save registration data in bulk for performance
    const dynamicAttributeRelations = await this.getAllRelationProgram(
      program.id,
    );
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
          program.id,
          registration.referenceId,
        );
      }
    }
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

  private async getAllRelationProgram(
    programId: number,
  ): Promise<RegistrationDataInfo[]> {
    const relations: RegistrationDataInfo[] = [];
    const programCustomAttributes =
      await this.programCustomAttributeRepository.find({
        where: { program: { id: programId } },
      });
    for (const attribute of programCustomAttributes) {
      relations.push({
        name: attribute.name,
        type: attribute.type,
        relation: {
          programCustomAttributeId: attribute.id,
        },
      });
    }

    const programQuestions = await this.programQuestionRepository.find({
      where: { program: { id: programId } },
    });

    for (const question of programQuestions) {
      relations.push({
        name: question.name,
        type: question.answerType,
        relation: {
          programQuestionId: question.id,
        },
      });
    }

    const fspAttributes = await this.fspAttributeRepository.find({
      relations: ['fsp', 'fsp.program'],
    });
    const programFspAttributes = fspAttributes.filter((a) =>
      a.fsp.program.map((p) => p.id).includes(programId),
    );

    for (const attribute of programFspAttributes) {
      relations.push({
        name: attribute.name,
        type: attribute.answerType,
        relation: {
          fspQuestionId: attribute.id,
        },
      });
    }

    return relations;
  }

  private prepareRegistrationData(
    registration: RegistrationEntity,
    customData: object,
    dynamicAttributeRelations: RegistrationDataInfo[],
  ): RegistrationDataEntity[] {
    const registrationDataArray: RegistrationDataEntity[] = [];
    for (const att of dynamicAttributeRelations) {
      let value;
      if (att.type === CustomAttributeType.boolean) {
        value = this.stringToBoolean(customData[att.name], false);
      } else if (att.type === CustomAttributeType.text) {
        value = customData[att.name] ? customData[att.name] : '';
      } else if (att.type === AnswerTypes.multiSelect) {
        value = customData[att.name].split('|');
      } else {
        value = customData[att.name];
      }
      const registrationData = new RegistrationDataEntity();
      registrationData.registration = registration;
      registrationData.value = value;
      registrationData.programCustomAttributeId =
        att.relation.programCustomAttributeId;
      registrationData.programQuestionId = att.relation.programQuestionId;
      registrationData.fspQuestionId = att.relation.fspQuestionId;
      registrationDataArray.push(registrationData);
    }
    return registrationDataArray;
  }

  private async csvToValidatedBulkImport(
    csvFile,
    programId: number,
  ): Promise<BulkImportDto[]> {
    const importRecords = await this.validateCsv(csvFile);
    return await this.validateBulkImportCsvInput(importRecords, programId);
  }

  private async csvToValidatedRegistrations(
    csvFile,
    programId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const importRecords = await this.validateCsv(csvFile);
    return await this.validateRegistrationsCsvInput(importRecords, programId);
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

  public checkForCompletelyEmptyRow(row): boolean {
    if (Object.keys(row).every((key) => !row[key])) {
      return true;
    }
    return false;
  }

  private async validateBulkImportCsvInput(
    csvArray,
    programId: number,
  ): Promise<BulkImportDto[]> {
    const errors = [];
    const validatatedArray = [];
    const programCustomAttributes = await this.getProgramCustomAttributes(
      programId,
    );
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
      const importRecord = new BulkImportDto();
      importRecord.phoneNumber = row.phoneNumber;
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
      for await (const att of programCustomAttributes) {
        if (
          (att.type === 'number' && isNaN(Number(row[att.name]))) ||
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
      };
    });
  }

  private async getDynamicAttributes(programId: number): Promise<Attribute[]> {
    let attributes = [];
    const programCustomAttributes = await this.getProgramCustomAttributes(
      programId,
    );
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
        };
      });
    return [...attributes, ...programFspAttributes.reverse()];
  }

  private async validateRegistrationsCsvInput(
    csvArray,
    programId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const errors = [];
    const validatatedArray = [];

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
      for await (const att of dynamicAttributes) {
        if (att.type === AnswerTypes.tel && row[att.name]) {
          const sanitized = await this.lookupService.lookupAndCorrect(
            row[att.name],
            true,
          );
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
          (att.type === 'number' && isNaN(Number(row[att.name]))) ||
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
