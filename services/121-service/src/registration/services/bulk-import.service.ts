import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../../programs/program.entity';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { ProgramAnswerEntity } from '../program-answer.entity';
import {
  AnswerTypes,
  Attribute,
  GenericAttributes,
} from '../enum/custom-data-attributes';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { ProgramQuestionEntity } from '../../programs/program-question.entity';
import { FspAttributeEntity } from '../../fsp/fsp-attribute.entity';
import {
  FinancialServiceProviderEntity,
  FspName,
} from '../../fsp/financial-service-provider.entity';
import { LanguageEnum } from '../enum/language.enum';
import {
  BulkImportDto,
  BulkImportResult,
  DynamicImportAttribute,
  ImportRegistrationsDto,
  ImportResult,
  ImportStatus,
  UploadFspReconciliationResult,
} from '../dto/bulk-import.dto';
import { v4 as uuid } from 'uuid';
import csv from 'csv-parser';
import { ActionService } from '../../actions/action.service';
import { AdditionalActionType } from '../../actions/action.entity';
import { validate } from 'class-validator';
import { Readable } from 'stream';
import { InclusionScoreService } from './inclusion-score.service';
import { UploadFspReconciliationDto } from '../../payments/dto/upload-fsp-reconciliation.dto';
import { TransactionsService } from '../../payments/transactions/transactions.service';
import { PaTransactionResultDto } from '../../payments/dto/payment-transaction-result.dto';
import { StatusEnum } from '../../shared/enum/status.enum';

@Injectable()
export class BulkImportService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
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
    private readonly actionService: ActionService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async importBulk(
    csvFile,
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedBulkImport(csvFile);

    let countImported = 0;
    let countExistingPhoneNr = 0;
    let countInvalidPhoneNr = 0;

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
        importResponseRecords.push(importResponseRecord);
        countInvalidPhoneNr += 1;
        continue;
      }

      let existingRegistrations = await this.registrationRepository.findOne({
        where: { phoneNumber: phoneNumberResult },
      });
      if (existingRegistrations) {
        importResponseRecord.importStatus = ImportStatus.existingPhoneNumber;
        importResponseRecords.push(importResponseRecord);
        countExistingPhoneNr += 1;
        continue;
      }

      importResponseRecord.importStatus = ImportStatus.imported;
      importResponseRecords.push(importResponseRecord);
      countImported += 1;

      const newRegistration = new RegistrationEntity();
      newRegistration.referenceId = uuid();
      newRegistration.phoneNumber = phoneNumberResult;
      newRegistration.preferredLanguage = LanguageEnum.en;
      newRegistration.namePartnerOrganization = record.namePartnerOrganization;
      newRegistration.paymentAmountMultiplier = record.paymentAmountMultiplier;
      newRegistration.program = program;
      const savedRegistration = await this.registrationRepository.save(
        newRegistration,
      );
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

  public async getImportRegistrationsTemplate(
    programId: number,
  ): Promise<string[]> {
    const genericAttributes = Object.values(GenericAttributes).map(item =>
      String(item),
    );
    const dynamicAttributes = await this.getDynamicAttributes(programId, true);
    const attributes = genericAttributes.concat(
      dynamicAttributes.map(d => d.attribute),
    );
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

    const dynamicAttributes = await this.getDynamicAttributes(program.id, true);
    for await (const record of validatedImportRecords) {
      const registration = new RegistrationEntity();
      registration.referenceId = uuid();
      registration.namePartnerOrganization = record.namePartnerOrganization;
      registration.phoneNumber = record.phoneNumber;
      registration.preferredLanguage = record.preferredLanguage;
      registration.program = program;

      registration.customData = JSON.parse(JSON.stringify({}));
      dynamicAttributes.forEach(att => {
        registration.customData[att.attribute] = record.programAttributes.find(
          a => a.attribute === att.attribute,
        ).value;
      });

      const fsp = await this.fspRepository.findOne({
        where: { fsp: record.fspName },
      });
      registration.fsp = fsp;
      registrations.push(registration);
    }
    const savedRegistrations = await this.registrationRepository.save(
      registrations,
    );
    // Update status and save again (otherwise 'registration.subscriber' doesn't work)
    savedRegistrations.forEach(
      r => (r.registrationStatus = RegistrationStatusEnum.registered),
    );
    await this.registrationRepository.save(savedRegistrations);

    for await (let registration of registrations) {
      registration.registrationStatus = RegistrationStatusEnum.registered;
      await this.storeProgramAnswersImportRegistrations(
        registration,
        program.id,
        registration.customData,
      );
      await this.inclusionScoreService.calculateInclusionScore(
        registration.referenceId,
      );

      countImported += 1;
    }

    return { aggregateImportResult: { countImported } };
  }

  private async storeProgramAnswersImportRegistrations(
    registration: RegistrationEntity,
    programId: number,
    customData: any,
  ): Promise<void> {
    const dynamicAttributes = await this.getDynamicAttributes(programId, false);
    let programAnswers: ProgramAnswerEntity[] = [];
    for await (let attribute of dynamicAttributes) {
      let programAnswer = new ProgramAnswerEntity();
      programAnswer.registration = registration;
      const programQuestion = await this.programQuestionRepository.findOne({
        where: { name: attribute.attribute },
      });
      programAnswer.programQuestion = programQuestion;
      programAnswer.programAnswer = customData[attribute.attribute];
      programAnswers.push(programAnswer);
    }
    await this.programAnswerRepository.save(programAnswers);
  }

  private async csvToValidatedBulkImport(csvFile): Promise<BulkImportDto[]> {
    const importRecords = await this.validateCsv(csvFile);
    return await this.validateBulkImportCsvInput(importRecords);
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
      const errors = `Wrong file extension. It should be .csv`;
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

  private async validateBulkImportCsvInput(csvArray): Promise<BulkImportDto[]> {
    const errors = [];
    const validatatedArray = [];
    for (const [i, row] of csvArray.entries()) {
      if (this.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      let importRecord = new BulkImportDto();
      importRecord.phoneNumber = row.phoneNumber;
      importRecord.namePartnerOrganization = row.namePartnerOrganization;
      importRecord.paymentAmountMultiplier = +row.paymentAmountMultiplier;
      const result = await validate(importRecord);
      if (result.length > 0) {
        const errorObj = {
          lineNumber: i + 1,
          column: result[0].property,
          value: result[0].value,
        };
        errors.push(errorObj);
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      validatatedArray.push(importRecord);
    }
    return validatatedArray;
  }

  private async getDynamicAttributes(
    programId: number,
    alsoFsp: boolean,
  ): Promise<Attribute[]> {
    const programAttributes = (
      await this.programQuestionRepository.find({
        where: { program: { id: programId } },
      })
    ).map(c => {
      return {
        attribute: c.name,
        type: c.answerType,
      };
    });
    if (!alsoFsp) {
      return programAttributes;
    }

    const fspAttributes = await this.fspAttributeRepository.find({
      relations: ['fsp', 'fsp.program'],
    });
    const programFspAttributes = fspAttributes
      .filter(a => a.fsp.program.map(p => p.id).includes(programId))
      .map(c => {
        return {
          attribute: c.name,
          type: c.answerType,
        };
      });
    return programAttributes.concat(programFspAttributes);
  }

  private async validateRegistrationsCsvInput(
    csvArray,
    programId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const errors = [];
    const validatatedArray = [];
    const dynamicAttributes = await this.getDynamicAttributes(programId, true);
    for (const [i, row] of csvArray.entries()) {
      if (this.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      let importRecord = new ImportRegistrationsDto();
      importRecord.preferredLanguage = row.preferredLanguage;
      importRecord.namePartnerOrganization = row.namePartnerOrganization;
      importRecord.phoneNumber = row.phoneNumber;
      importRecord.fspName = row.fspName;
      importRecord.programAttributes = [];
      for await (const att of dynamicAttributes) {
        if (att.type === AnswerTypes.tel && row[att.attribute]) {
          const sanitized = await this.lookupService.lookupAndCorrect(
            row[att.attribute],
            true,
          );
          if (!sanitized && !!row[att.attribute]) {
            const errorObj = {
              lineNumber: i + 1,
              column: att.attribute,
              value: row[att.attribute],
            };
            errors.push(errorObj);
            throw new HttpException(errors, HttpStatus.BAD_REQUEST);
          }
          row[att.attribute] = sanitized;
        }
        const programAttribute = new DynamicImportAttribute();
        programAttribute.attribute = att.attribute;
        programAttribute.value = row[att.attribute];
        importRecord.programAttributes.push(programAttribute);
      }

      const result = await validate(importRecord);
      if (result.length > 0) {
        const errorObj = {
          lineNumber: i + 1,
          column: result[0].property,
          value: result[0].value,
        };
        errors.push(errorObj);
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      validatatedArray.push(importRecord);
    }
    return validatatedArray;
  }

  public async importFspReconciliation(
    csvFile,
    programId: number,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedFspReconciliation(
      csvFile,
    );

    let countImported = 0;
    let countNotFound = 0;

    const importResponseRecords = [];
    for await (const record of validatedImportRecords) {
      const importResponseRecord = record as UploadFspReconciliationResult;

      const registration = await this.registrationRepository.findOne({
        where: { referenceId: record.referenceId },
        relations: ['fsp'],
      });
      if (!registration) {
        importResponseRecord.importStatus = ImportStatus.unmatched;
        importResponseRecords.push(importResponseRecord);
        countNotFound += 1;
        continue;
      }

      const paTransactionResult = new PaTransactionResultDto();
      paTransactionResult.referenceId = record.referenceId;
      paTransactionResult.status = record.status as StatusEnum;
      paTransactionResult.fspName = registration.fsp.fsp as FspName;
      paTransactionResult.message = '';
      paTransactionResult.calculatedAmount = Number(record.amount);

      await this.transactionsService.storeTransaction(
        paTransactionResult,
        programId,
        Number(record.payment),
      );

      importResponseRecord.importStatus = ImportStatus.imported;
      importResponseRecords.push(importResponseRecord);
      countImported += 1;
    }

    this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importPeopleAffected,
    );

    return {
      importResult: importResponseRecords,
      aggregateImportResult: {
        countImported,
        countNotFound,
      },
    };
  }

  private async csvToValidatedFspReconciliation(
    csvFile,
  ): Promise<UploadFspReconciliationDto[]> {
    const importRecords = await this.validateCsv(csvFile);
    return await this.validateFspReconciliationCsvInput(importRecords);
  }

  private async validateFspReconciliationCsvInput(
    csvArray,
  ): Promise<UploadFspReconciliationDto[]> {
    const errors = [];
    const validatatedArray = [];
    for (const [i, row] of csvArray.entries()) {
      if (this.checkForCompletelyEmptyRow(row)) {
        continue;
      }
      let importRecord = new UploadFspReconciliationDto();
      importRecord.referenceId = row.referenceId;
      importRecord.payment = row.payment;
      importRecord.status = row.status;
      importRecord.amount = row.amount;
      const result = await validate(importRecord);
      if (result.length > 0) {
        const errorObj = {
          lineNumber: i + 1,
          column: result[0].property,
          value: result[0].value,
        };
        errors.push(errorObj);
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      validatatedArray.push(importRecord);
    }
    return validatatedArray;
  }
}
