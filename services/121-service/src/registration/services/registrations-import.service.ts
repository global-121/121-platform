import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AdditionalActionType } from '../../actions/action.entity';
import { ActionService } from '../../actions/action.service';
import { EventsService } from '../../events/events.service';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../../fsp/fsp-question.entity';
import { LookupService } from '../../notifications/lookup/lookup.service';
import { CustomAttributeType } from '../../programs/dto/create-program-custom-attribute.dto';
import { ProgramCustomAttributeEntity } from '../../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../../programs/program-question.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { ProgramService } from '../../programs/programs.service';
import { ScopedRepository } from '../../scoped.repository';
import { FileImportService } from '../../utils/file-import/file-import.service';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import {
  BulkImportDto,
  BulkImportResult,
  ImportRegistrationsDto,
  ImportResult,
  ImportStatus,
} from '../dto/bulk-import.dto';
import { RegistrationDataInfo } from '../dto/registration-data-relation.model';
import { RegistrationsUpdateJobDto as RegistrationUpdateJobDto } from '../dto/registration-update-job.dto';
import { ValidationConfigDto } from '../dto/validate-registration-config.dto';
import {
  AnswerTypes,
  Attribute,
  GenericAttributes,
  QuestionType,
} from '../enum/custom-data-attributes';
import { RegistrationCsvValidationEnum } from '../enum/registration-csv-validation.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { QueueRegistrationUpdateService } from '../modules/queue-registrations-update/queue-registrations-update.service';
import { RegistrationUtilsService } from '../modules/registration-utilts/registration-utils.service';
import { RegistrationDataEntity } from '../registration-data.entity';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationsInputValidator } from '../validators/registrations-input-validator';
import { RegistrationsInputValidatorHelpers } from '../validators/registrations-input.validator.helper';
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
    private readonly fileImportService: FileImportService,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly eventsService: EventsService,
    private readonly queueRegistrationUpdateService: QueueRegistrationUpdateService,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
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
    const validatedRegistrations = await this.validateBulkUpdateInput(
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
            ? RegistrationsInputValidatorHelpers.stringToBoolean(
                record[att.name],
                false,
              )
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
          customData[att.name] =
            RegistrationsInputValidatorHelpers.stringToBoolean(
              record[att.name],
              false,
            );
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
        values.push(
          RegistrationsInputValidatorHelpers.stringToBoolean(
            customData[att.name],
            false,
          ),
        );
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

    const dynamicAttributes = await this.getDynamicAttributes(programId);
    return await this.registrationsInputValidator.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      dynamicAttributes,
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
    const dynamicAttributes = await this.getDynamicAttributes(programId);
    return (await this.registrationsInputValidator.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      dynamicAttributes,
      RegistrationCsvValidationEnum.importAsRegistered,
      validationConfig,
    )) as ImportRegistrationsDto[];
  }

  private async validateBulkUpdateInput(
    csvArray: any[],
    programId: number,
    userId: number,
  ): Promise<ImportRegistrationsDto[]> {
    const program = await this.programService.findProgramOrThrow(programId);
    const validationConfig = new ValidationConfigDto();
    validationConfig.validateExistingReferenceId = false;
    validationConfig.validatePhoneNumberEmpty = !program.allowEmptyPhoneNumber;
    validationConfig.validatePhoneNumberLookup = true;
    validationConfig.validateClassValidator = true;
    validationConfig.validateUniqueReferenceId = false;
    validationConfig.validateScope = true;
    validationConfig.validatePreferredLanguage = true;
    validationConfig.validateDynamicAttributes = true;

    const dynamicAttributes = await this.getDynamicAttributes(programId);

    return (await this.registrationsInputValidator.validateAndCleanRegistrationsInput(
      csvArray,
      programId,
      userId,
      dynamicAttributes,
      RegistrationCsvValidationEnum.bulkUpdate,
      validationConfig,
    )) as ImportRegistrationsDto[];
  }
}
