import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { EventsService } from '@121-service/src/events/events.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationsUpdateJobDto as RegistrationUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import {
  AttributeWithOptionalLabel,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import { ValidationRegistrationConfig } from '@121-service/src/registration/interfaces/validate-registration-config.interface';
import { ValidatedRegistrationInput } from '@121-service/src/registration/interfaces/validated-registration-input.interface';
import { QueueRegistrationUpdateService } from '@121-service/src/registration/modules/queue-registrations-update/queue-registrations-update.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { RegistrationsInputValidatorHelpers } from '@121-service/src/registration/validators/registrations-input.validator.helper';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

const BATCH_SIZE = 500;
const MASS_UPDATE_ROW_LIMIT = 100000;

@Injectable()
export class RegistrationsImportService {
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly actionService: ActionsService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly programService: ProgramService,
    private readonly fileImportService: FileImportService,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly eventsService: EventsService,
    private readonly queueRegistrationUpdateService: QueueRegistrationUpdateService,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
  ) {}

  public async patchBulk(
    csvFile: Express.Multer.File,
    programId: number,
    userId: number,
    reason: string,
  ): Promise<void> {
    const bulkUpdateRecords = await this.fileImportService.validateCsv(
      csvFile,
      MASS_UPDATE_ROW_LIMIT,
    );

    // Do initial validation of the input without the checks that are slow
    // So the user gets some feedback immidiately after upload
    // The rest of the checks will be done in the queue (the user will get no feedback of this)
    await this.validateBulkUpdateInput(bulkUpdateRecords, programId, userId);

    // Prepare the job array to push to the queue
    const updateJobs: RegistrationUpdateJobDto[] = bulkUpdateRecords.map(
      (record) => {
        const referenceId = record['referenceId'];
        delete record['referenceId'];
        return {
          referenceId,
          data: record,
          programId,
          reason,
        } as RegistrationUpdateJobDto;
      },
    );

    // Call to redis as concurrent operations in a batch
    for (let start = 0; start < updateJobs.length; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE, updateJobs.length);
      await Promise.allSettled(
        updateJobs
          .slice(start, end)
          .map((job) =>
            this.queueRegistrationUpdateService.addRegistrationUpdateToQueue(
              job,
            ),
          ),
      );
    }
  }

  public async getImportRegistrationsTemplate(
    programId: number,
  ): Promise<string[]> {
    const genericAttributes: string[] = [
      GenericRegistrationAttributes.referenceId,
      GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
    ];
    const dynamicAttributes: string[] = (
      await this.getDynamicAttributes(programId)
    ).map((d) => d.name);

    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });
    // If paymentAmountMultiplier automatic, then drop from template
    if (!program.paymentAmountMultiplierFormula) {
      genericAttributes.push(
        String(GenericRegistrationAttributes.paymentAmountMultiplier),
      );
    }
    if (program.enableMaxPayments) {
      genericAttributes.push(String(GenericRegistrationAttributes.maxPayments));
    }
    if (program.enableScope) {
      genericAttributes.push(String(GenericRegistrationAttributes.scope));
    }

    const attributes = genericAttributes.concat(dynamicAttributes);
    return [...new Set(attributes)]; // Deduplicates attributes
  }

  public async importRegistrations(
    inputRegistrations: Record<string, string | boolean | number | undefined>[],
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.validateImportRegistrationsInput(
      inputRegistrations,
      program.id,
      userId,
    );
    return await this.importValidatedRegistrations(
      validatedImportRecords,
      program,
      userId,
    );
  }

  public async importRegistrationsFromCsv(
    csvFile: Express.Multer.File,
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    const maxRecords = 1000;
    const importRecords = await this.fileImportService.validateCsv(
      csvFile,
      maxRecords,
    );
    // TODO: Improve the typing of what comes out validateCsv function to avoid this cast
    return this.importRegistrations(
      importRecords as Record<string, string | boolean | number | undefined>[],
      program,
      userId,
    );
  }

  public async importValidatedRegistrations(
    validatedImportRecords: ValidatedRegistrationInput[],
    program: ProgramEntity,
    userId: number,
  ): Promise<ImportResult> {
    let countImported = 0;
    const dynamicAttributes = await this.getDynamicAttributes(program.id);
    const registrations: RegistrationEntity[] = [];
    const customDataList: Record<string, unknown>[] = [];

    const programFinancialServiceProviderConfigurations =
      await this.getProgramFinancialServiceProviderConfigurations(
        validatedImportRecords,
        program,
      );

    for await (const record of validatedImportRecords) {
      const registration = new RegistrationEntity();
      registration.referenceId = record.referenceId || uuid();
      registration.phoneNumber = record.phoneNumber ?? null;
      registration.preferredLanguage = record.preferredLanguage ?? null;
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
        if (att.type === RegistrationAttributeTypes.boolean) {
          customData[att.name] =
            RegistrationsInputValidatorHelpers.inputToBoolean(
              record.data[att.name],
              false,
            );
        } else {
          customData[att.name] = record.data[att.name];
        }
      }

      registration.programFinancialServiceProviderConfiguration =
        programFinancialServiceProviderConfigurations[
          record.programFinancialServiceProviderConfigurationName!
        ];

      registrations.push(registration);
      customDataList.push(customData);
    }

    // Save registrations using .save to properly set registrationProgramId
    const savedRegistrations: RegistrationEntity[] = [];
    for await (const registration of registrations) {
      const savedRegistration =
        await this.registrationUtilsService.save(registration);
      savedRegistrations.push(savedRegistration);
    }

    // Save registration status change events they changed from null to registered
    await this.eventsService.log(
      savedRegistrations.map((r) => ({
        id: r.id,
        status: undefined,
      })),
      savedRegistrations.map((r) => ({
        id: r.id,
        status: r.registrationStatus!,
      })),
      { registrationAttributes: ['status'] },
    );

    // Save registration data in bulk for performance
    const dynamicAttributeRelations =
      await this.programService.getAllRelationProgram(program.id);
    let registrationDataArrayAllPa: RegistrationAttributeDataEntity[] = [];
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

  private async getProgramFinancialServiceProviderConfigurations(
    validatedImportRecords: ValidatedRegistrationInput[],
    program: ProgramEntity,
  ) {
    const programFinancialServiceProviderConfigurations = {};
    const uniqueConfigNames = Array.from(
      new Set(
        validatedImportRecords
          .filter(
            (record) =>
              record.programFinancialServiceProviderConfigurationName !==
              undefined,
          )
          .map(
            (record) => record.programFinancialServiceProviderConfigurationName,
          ),
      ),
    );
    for (const programFinancialServiceProviderConfigurationName of uniqueConfigNames) {
      programFinancialServiceProviderConfigurations[
        programFinancialServiceProviderConfigurationName!
      ] =
        await this.programFinancialServiceProviderConfigurationRepository.findOneOrFail(
          {
            where: {
              name: Equal(
                programFinancialServiceProviderConfigurationName ?? '',
              ),
              programId: Equal(program.id),
            },
          },
        );
    }
    return programFinancialServiceProviderConfigurations;
  }

  private async programHasInclusionScore(programId: number): Promise<boolean> {
    const programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: {
          programId: Equal(programId),
        },
      });
    for (const attribute of programRegistrationAttributes) {
      if (
        attribute.scoring != null &&
        JSON.stringify(attribute.scoring) !== '{}'
      ) {
        return true;
      }
    }
    return false;
  }

  private prepareRegistrationData(
    registration: RegistrationEntity,
    customData: object,
    dynamicAttributeRelations: RegistrationDataInfo[],
  ): RegistrationAttributeDataEntity[] {
    const registrationDataArray: RegistrationAttributeDataEntity[] = [];
    for (const att of dynamicAttributeRelations) {
      let values: unknown[] = [];
      if (att.type === RegistrationAttributeTypes.boolean) {
        values.push(
          RegistrationsInputValidatorHelpers.inputToBoolean(
            customData[att.name],
            false,
          ),
        );
      } else if (att.type === RegistrationAttributeTypes.text) {
        values.push(customData[att.name] ? customData[att.name] : '');
      } else if (att.type === RegistrationAttributeTypes.multiSelect) {
        values = customData[att.name].split('|');
      } else {
        values.push(customData[att.name]);
      }
      for (const value of values) {
        if (value != null) {
          const registrationData = new RegistrationAttributeDataEntity();
          registrationData.registration = registration;
          registrationData.value = value as string;
          registrationData.programRegistrationAttributeId =
            att.relation.programRegistrationAttributeId;
          registrationDataArray.push(registrationData);
        }
      }
    }
    return registrationDataArray;
  }

  private async getDynamicAttributes(
    programId: number,
  ): Promise<AttributeWithOptionalLabel[]> {
    const programRegistrationAttributes = (
      await this.programRegistrationAttributeRepository.find({
        where: { program: { id: Equal(programId) } },
      })
    ).map((attribute) => {
      return {
        id: attribute.id,
        name: attribute.name,
        type: attribute.type,
        options: attribute.options,
        isRequired: attribute.isRequired,
      } as AttributeWithOptionalLabel;
    });
    return programRegistrationAttributes;
  }

  public async validateImportRegistrationsInput(
    registrationInputToValidate: Record<
      string,
      string | boolean | number | undefined
    >[],
    programId: number,
    userId: number,
  ): Promise<ValidatedRegistrationInput[]> {
    const validationConfig: ValidationRegistrationConfig = {
      validatePhoneNumberLookup: true,
      validateUniqueReferenceId: true,
      validateExistingReferenceId: true,
    };
    const data = await this.registrationsInputValidator.validateAndCleanInput({
      registrationInputArray: registrationInputToValidate,
      programId,
      userId,
      typeOfInput: RegistrationValidationInputType.create,
      validationConfig,
    });
    return data;
  }

  private async validateBulkUpdateInput(
    csvArray: any[],
    programId: number,
    userId: number,
  ): Promise<ValidatedRegistrationInput[]> {
    const validationConfig: ValidationRegistrationConfig = {
      validateExistingReferenceId: false,
      validatePhoneNumberLookup: false,
      validateUniqueReferenceId: false,
    };
    const result = await this.registrationsInputValidator.validateAndCleanInput(
      {
        registrationInputArray: csvArray,
        programId,
        userId,
        typeOfInput: RegistrationValidationInputType.update,
        validationConfig,
      },
    );
    return result;
  }
}
