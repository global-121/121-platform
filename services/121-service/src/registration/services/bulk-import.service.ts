import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
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
import {
  AnswerTypes,
  Attribute,
  GenericAttributes,
} from '../enum/custom-data-attributes';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationDataEntity } from './../registration-data.entity';
import { InlusionScoreService } from './inclusion-score.service';

export enum ImportType {
  imported = 'import-as-imported',
  registered = 'import-as-registered',
}

@Injectable()
export class BulkImportService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationDataEntity)
  private readonly registrationDataRepository: Repository<
    RegistrationDataEntity
  >;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(ProgramCustomAttributeEntity)
  private readonly programCustomAttributeRepository: Repository<
    ProgramCustomAttributeEntity
  >;
  @InjectRepository(FinancialServiceProviderEntity)
  private readonly fspRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspAttributeRepository: Repository<FspQuestionEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly lookupService: LookupService,
    private readonly actionService: ActionService,
    private readonly inclusionScoreService: InlusionScoreService,
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

      let existingRegistrations = await this.registrationRepository.findOne({
        where: { phoneNumber: phoneNumberResult, programId: program.id },
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
      newRegistration.program = program;

      const savedRegistration = await this.registrationRepository.save(
        newRegistration,
      );
      programCustomAttributes.forEach(async att => {
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
      return defaultValue || undefined;
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
        return defaultValue || undefined;
    }
  }

  public async getImportRegistrationsTemplate(
    programId: number,
    type: ImportType,
  ): Promise<string[]> {
    let genericAttributes: string[];
    let dynamicAttributes: string[];

    if (type === ImportType.registered) {
      genericAttributes = Object.values(GenericAttributes).map(item =>
        String(item),
      );
      dynamicAttributes = (await this.getDynamicAttributes(programId)).map(
        d => d.name,
      );
    } else if (type === ImportType.imported) {
      genericAttributes = [
        GenericAttributes.phoneNumber,
        GenericAttributes.paymentAmountMultiplier,
        GenericAttributes.preferredLanguage,
      ].map(item => String(item));
      dynamicAttributes = (
        await this.getProgramCustomAttributes(programId)
      ).map(d => d.name);
    }

    // If paymentAmountMultiplier automatic, then drop from template
    const program = await this.programRepository.findOne(programId);
    if (!!program.paymentAmountMultiplierFormula) {
      const index = genericAttributes.indexOf(
        GenericAttributes.paymentAmountMultiplier,
      );
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

    let countImported = 0;
    let registrations: RegistrationEntity[] = [];
    const customDataList = [];

    const dynamicAttributes = await this.getDynamicAttributes(program.id);
    for await (const record of validatedImportRecords) {
      const registration = new RegistrationEntity();
      registration.referenceId = uuid();
      registration.phoneNumber = record.phoneNumber;
      registration.preferredLanguage = record.preferredLanguage;
      registration.program = program;
      const customData = {};
      if (!program.paymentAmountMultiplierFormula) {
        registration.paymentAmountMultiplier = record.paymentAmountMultiplier;
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
    const savedRegistrations = await this.registrationRepository.save(
      registrations,
    );
    // Update status and save again (otherwise 'registration.subscriber' doesn't work)
    savedRegistrations.forEach(
      r => (r.registrationStatus = RegistrationStatusEnum.registered),
    );
    await this.registrationRepository.save(savedRegistrations);

    for await (let [i, registration] of savedRegistrations.entries()) {
      registration.registrationStatus = RegistrationStatusEnum.registered;
      await this.storeRegistrationData(
        registration,
        program.id,
        customDataList[i],
      );
      await this.inclusionScoreService.calculateInclusionScore(
        registration.referenceId,
      );
      await this.inclusionScoreService.calculatePaymentAmountMultiplier(
        program.id,
        registration.referenceId,
      );

      countImported += 1;
    }

    return { aggregateImportResult: { countImported } };
  }

  private async storeRegistrationData(
    registration: RegistrationEntity,
    programId: number,
    customData: object,
  ): Promise<void> {
    const dynamicAttributes = await this.getDynamicAttributes(programId);
    for await (let att of dynamicAttributes) {
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
      try {
        value = await registration.saveData(value, {
          name: att.name,
        });
      } catch (error) {
        // Skip data that is not relevant PA like fsp question of FSP for which they are not registered
        if (error.name !== 'RegistrationDataSaveError') {
          throw error;
        }
      }
    }
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

  private async validateCsv(csvFile): Promise<object[]> {
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

  private async csvBufferToArray(buffer, separator): Promise<object[]> {
    const stream = new Readable();
    stream.push(buffer.toString());
    stream.push(null);
    let parsedData = [];
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

  private checkForCompletelyEmptyRow(row): boolean {
    if (Object.keys(row).every(key => !row[key])) {
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
    const program = await this.programRepository.findOne(programId);
    for (const [i, row] of csvArray.entries()) {
      if (this.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      let importRecord = new BulkImportDto();
      importRecord.phoneNumber = row.phoneNumber;
      importRecord.preferredLanguage = row.preferredLanguage
        ? row.preferredLanguage
        : LanguageEnum.en;
      if (!program.paymentAmountMultiplierFormula) {
        importRecord.paymentAmountMultiplier = +row.paymentAmountMultiplier;
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
    ).map(c => {
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
    ).map(c => {
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
      .filter(a => a.fsp.program.map(p => p.id).includes(programId))
      .map(c => {
        return {
          id: c.id,
          name: c.name,
          type: c.answerType,
        };
      });
    return [...attributes, ...programFspAttributes];
  }

  private async validateRegistrationsCsvInput(
    csvArray,
    programId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const errors = [];
    const validatatedArray = [];
    const dynamicAttributes = await this.getDynamicAttributes(programId);
    const program = await this.programRepository.findOne(programId);
    for (const [i, row] of csvArray.entries()) {
      if (this.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      let importRecord = new ImportRegistrationsDto();
      importRecord.preferredLanguage = row.preferredLanguage;
      importRecord.phoneNumber = row.phoneNumber;
      importRecord.fspName = row.fspName;
      if (!program.paymentAmountMultiplierFormula) {
        importRecord.paymentAmountMultiplier = +row.paymentAmountMultiplier;
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
}
