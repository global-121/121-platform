import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../../programs/program/program.entity';
import { UserEntity } from '../../user/user.entity';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { ProgramAnswerEntity } from '../program-answer.entity';
import {
  AnswerTypes,
  Attribute,
  GenericAttributes,
} from '../dto/custom-data-attributes';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { ProgramQuestionEntity } from '../../programs/program/program-question.entity';
import { FspAttributeEntity } from '../../programs/fsp/fsp-attribute.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationStatusChangeEntity } from '../registration-status-change.entity';
import {
  BulkImportDto,
  DynamicImportAttribute,
  ImportRegistrationsDto,
  ImportResult,
} from '../dto/bulk-import.dto';
import { v4 as uuid } from 'uuid';
import csv from 'csv-parser';
import { ActionService } from '../../actions/action.service';
import { AdditionalActionType } from '../../actions/action.entity';
import { validate } from 'class-validator';
import { Readable } from 'stream';
import { InlusionScoreService } from './inclusion-score.service';

@Injectable()
export class BulkImportService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationStatusChangeEntity)
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
    private readonly actionService: ActionService,
    private readonly inclusionScoreService: InlusionScoreService,
  ) {}

  public async importBulk(
    csvFile,
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.csvToValidatedBulkImport(csvFile);

    let countImported = 0;
    let countInvalidPhoneNr = 0;
    let countExistingPhoneNr = 0;
    for await (const record of validatedImportRecords) {
      const throwNoException = true;
      const phoneNumberResult = await this.lookupService.lookupAndCorrect(
        record.phoneNumber,
        throwNoException,
      );
      if (!phoneNumberResult) {
        countInvalidPhoneNr += 1;
        continue;
      }

      let existingRegistrations = await this.registrationRepository.find({
        where: { phoneNumber: phoneNumberResult },
      });
      if (existingRegistrations.length > 0) {
        countExistingPhoneNr += 1;
        continue;
      }

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
      countImported,
      countInvalidPhoneNr,
      countExistingPhoneNr,
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
      // Mimic 'register for program' step for each registration
      await this.inclusionScoreService.calculateInclusionScore(
        registration.referenceId,
      );

      await this.storeProgramAnswersImportRegistrations(
        registration,
        program.id,
        registration.customData,
      );

      countImported += 1;
    }

    return { countImported };
  }

  private async storeProgramAnswersImportRegistrations(
    registration: RegistrationEntity,
    programId: number,
    customData: any,
  ): Promise<void> {
    const dynamicAttributes = await this.getDynamicAttributes(programId, false);
    let programAnswers: ProgramAnswerEntity[] = [];
    dynamicAttributes.forEach(async attribute => {
      let programAnswer = new ProgramAnswerEntity();
      programAnswer.registration = registration;
      const programQuestion = await this.programQuestionRepository.findOne({
        where: { name: attribute.attribute },
      });
      programAnswer.programQuestion = programQuestion;
      programAnswer.programAnswer = customData[attribute.attribute];
      programAnswers.push(programAnswer);
    });
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
}
