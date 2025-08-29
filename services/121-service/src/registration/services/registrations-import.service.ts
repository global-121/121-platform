import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { ProjectService } from '@121-service/src/projects/projects.service';
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
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { InclusionScoreService } from '@121-service/src/registration/services/inclusion-score.service';
import { QueueRegistrationUpdateService } from '@121-service/src/registration/services/queue-registrations-update.service';
import { RegistrationsInputValidatorHelpers } from '@121-service/src/registration/validators/registrations-input.validator.helper';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

const BATCH_SIZE = 500;
const MASS_UPDATE_ROW_LIMIT = 50_000;

@Injectable()
export class RegistrationsImportService {
  @InjectRepository(ProjectRegistrationAttributeEntity)
  private readonly projectRegistrationAttributeRepository: Repository<ProjectRegistrationAttributeEntity>;
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;

  public constructor(
    private readonly actionService: ActionsService,
    private readonly inclusionScoreService: InclusionScoreService,
    private readonly projectService: ProjectService,
    private readonly fileImportService: FileImportService,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationEventsService: RegistrationEventsService,
    private readonly queueRegistrationUpdateService: QueueRegistrationUpdateService,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
    private readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,
  ) {}

  public async patchBulk(
    csvFile: Express.Multer.File,
    projectId: number,
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
    await this.validateBulkUpdateInput(bulkUpdateRecords, projectId, userId);

    // Prepare the job array to push to the queue
    const updateJobs: Omit<RegistrationUpdateJobDto, 'request'>[] =
      bulkUpdateRecords.map((record) => {
        const referenceId = record['referenceId'] as string;
        delete record['referenceId'];
        return {
          referenceId,
          data: record,
          projectId,
          reason,
        };
      });

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
    projectId: number,
  ): Promise<string[]> {
    const genericAttributes: string[] = [
      GenericRegistrationAttributes.referenceId,
      GenericRegistrationAttributes.projectFspConfigurationName,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
    ];
    const dynamicAttributes: string[] = (
      await this.getDynamicAttributes(projectId)
    ).map((d) => d.name);

    const project = await this.projectRepository.findOneByOrFail({
      id: projectId,
    });
    // If paymentAmountMultiplier automatic, then drop from template
    if (!project.paymentAmountMultiplierFormula) {
      genericAttributes.push(
        String(GenericRegistrationAttributes.paymentAmountMultiplier),
      );
    }
    if (project.enableMaxPayments) {
      genericAttributes.push(String(GenericRegistrationAttributes.maxPayments));
    }
    if (project.enableScope) {
      genericAttributes.push(String(GenericRegistrationAttributes.scope));
    }

    const attributes = genericAttributes.concat(dynamicAttributes);
    return [...new Set(attributes)]; // Deduplicates attributes
  }

  public async importRegistrations(
    inputRegistrations: Record<string, string | boolean | number | undefined>[],
    project: ProjectEntity,
    userId: number,
  ): Promise<ImportResult> {
    const validatedImportRecords = await this.validateImportRegistrationsInput(
      inputRegistrations,
      project.id,
      userId,
    );
    return await this.importValidatedRegistrations(
      validatedImportRecords,
      project,
      userId,
    );
  }

  public async importRegistrationsFromCsv(
    csvFile: Express.Multer.File,
    project: ProjectEntity,
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
      project,
      userId,
    );
  }

  public async importValidatedRegistrations(
    validatedImportRecords: ValidatedRegistrationInput[],
    project: ProjectEntity,
    userId: number,
  ): Promise<ImportResult> {
    let countImported = 0;
    const dynamicAttributes = await this.getDynamicAttributes(project.id);
    const registrations: RegistrationEntity[] = [];
    const customDataList: Record<string, unknown>[] = [];

    const projectFspConfigurations = await this.getProjectFspConfigurations(
      validatedImportRecords,
      project,
    );

    for await (const record of validatedImportRecords) {
      const registration = new RegistrationEntity();
      registration.referenceId = record.referenceId || uuid();
      registration.phoneNumber = record.phoneNumber ?? null;
      registration.preferredLanguage = record.preferredLanguage ?? null;
      registration.project = project;
      registration.inclusionScore = 0;
      registration.registrationStatus = RegistrationStatusEnum.new;
      const customData = {};
      if (!project.paymentAmountMultiplierFormula) {
        registration.paymentAmountMultiplier =
          record.paymentAmountMultiplier || 1;
      }
      if (project.enableMaxPayments) {
        registration.maxPayments = record.maxPayments;
      }
      if (project.enableScope) {
        registration.scope = record.scope || '';
      }
      for await (const att of dynamicAttributes) {
        if (att.type === RegistrationAttributeTypes.boolean) {
          customData[att.name] =
            RegistrationsInputValidatorHelpers.inputToBoolean(
              record.data[att.name],
            );
        } else {
          customData[att.name] = record.data[att.name];
        }
      }

      registration.projectFspConfiguration =
        projectFspConfigurations[record.projectFspConfigurationName!];

      registrations.push(registration);
      customDataList.push(customData);
    }

    // Save registrations using .save to properly set registrationProjectId
    const savedRegistrations: RegistrationEntity[] = [];
    for await (const registration of registrations) {
      const savedRegistration =
        await this.registrationUtilsService.save(registration);
      savedRegistrations.push(savedRegistration);
    }

    // Save registration status change events they changed from null to 'new'
    await this.registrationEventsService.createFromRegistrationViews(
      savedRegistrations.map((r) => ({
        id: r.id,
        status: undefined,
      })),
      savedRegistrations.map((r) => ({
        id: r.id,
        status: r.registrationStatus!,
      })),
      { explicitRegistrationPropertyNames: ['status'] },
    );

    // Save registration data in bulk for performance
    const dynamicAttributeRelations =
      await this.projectService.getAllRelationProject(project.id);
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
    const projectHasScore = await this.projectHasInclusionScore(project.id);
    for await (const registration of savedRegistrations) {
      if (projectHasScore) {
        await this.inclusionScoreService.calculateInclusionScore(
          registration.referenceId,
        );
      }
      if (project.paymentAmountMultiplierFormula) {
        await this.inclusionScoreService.calculatePaymentAmountMultiplier(
          project,
          registration.referenceId,
        );
      }
    }
    await this.actionService.saveAction(
      userId,
      project.id,
      AdditionalActionType.importRegistrations,
    );

    return { aggregateImportResult: { countImported } };
  }

  private async getProjectFspConfigurations(
    validatedImportRecords: ValidatedRegistrationInput[],
    project: ProjectEntity,
  ) {
    const projectFspConfigurations = {};
    const uniqueConfigNames = Array.from(
      new Set(
        validatedImportRecords
          .filter((record) => record.projectFspConfigurationName !== undefined)
          .map((record) => record.projectFspConfigurationName),
      ),
    );
    for (const projectFspConfigurationName of uniqueConfigNames) {
      projectFspConfigurations[projectFspConfigurationName!] =
        await this.projectFspConfigurationRepository.findOneOrFail({
          where: {
            name: Equal(projectFspConfigurationName ?? ''),
            projectId: Equal(project.id),
          },
        });
    }
    return projectFspConfigurations;
  }

  private async projectHasInclusionScore(projectId: number): Promise<boolean> {
    const projectRegistrationAttributes =
      await this.projectRegistrationAttributeRepository.find({
        where: {
          projectId: Equal(projectId),
        },
      });
    for (const attribute of projectRegistrationAttributes) {
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
          registrationData.projectRegistrationAttributeId =
            att.relation.projectRegistrationAttributeId;
          registrationDataArray.push(registrationData);
        }
      }
    }
    return registrationDataArray;
  }

  private async getDynamicAttributes(
    projectId: number,
  ): Promise<AttributeWithOptionalLabel[]> {
    const projectRegistrationAttributes = (
      await this.projectRegistrationAttributeRepository.find({
        where: { project: { id: Equal(projectId) } },
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
    return projectRegistrationAttributes;
  }

  public async validateImportRegistrationsInput(
    registrationInputToValidate: Record<
      string,
      string | boolean | number | undefined
    >[],
    projectId: number,
    userId: number,
  ): Promise<ValidatedRegistrationInput[]> {
    const validationConfig: ValidationRegistrationConfig = {
      validateUniqueReferenceId: true,
      validateExistingReferenceId: true,
    };
    const data = await this.registrationsInputValidator.validateAndCleanInput({
      registrationInputArray: registrationInputToValidate,
      projectId,
      userId,
      typeOfInput: RegistrationValidationInputType.create,
      validationConfig,
    });
    return data;
  }

  private async validateBulkUpdateInput(
    csvArray: any[],
    projectId: number,
    userId: number,
  ): Promise<ValidatedRegistrationInput[]> {
    const validationConfig: ValidationRegistrationConfig = {
      validateExistingReferenceId: false,
      validateUniqueReferenceId: false,
    };
    const result = await this.registrationsInputValidator.validateAndCleanInput(
      {
        registrationInputArray: csvArray,
        projectId,
        userId,
        typeOfInput: RegistrationValidationInputType.bulkUpdate,
        validationConfig,
      },
    );
    return result;
  }
}
