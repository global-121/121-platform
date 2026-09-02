import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, IsNull, Not, Repository } from 'typeorm';

import { ACTIVITY_INFO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES } from '@121-service/src/activityinfo/consts/activityinfo-allowed-registration-view-attributes.const';
import { fspFieldCode } from '@121-service/src/activityinfo/consts/activityinfo-fsp-field.const';
import { ActivityInfoResponseDto } from '@121-service/src/activityinfo/dtos/activityinfo-response.dto';
import { ActivityInfoEntity } from '@121-service/src/activityinfo/entities/activityinfo.entity';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { ActivityInfoFormDefinition } from '@121-service/src/activityinfo/interfaces/activityinfo-form-definition.interface';
import { ActivityInfoEntityMapper } from '@121-service/src/activityinfo/mappers/activityinfo-entity.mapper';
import { ActivityInfoFormDefinitionMapper } from '@121-service/src/activityinfo/mappers/activityinfo-form-definition.mapper';
import { ActivityInfoValidationService } from '@121-service/src/activityinfo/services/activityinfo.validation.service';
import { ActivityInfoApiService } from '@121-service/src/activityinfo/services/activityinfo-api.service';
import { ActivityInfoFieldProcessorService } from '@121-service/src/activityinfo/services/activityinfo-field-processor.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

/**
 * Validation rejects any ActivityInfo form that declares a language other than
 * English, and a form that declares none is assumed to be English, so labels
 * imported from ActivityInfo are always stored under 'en'.
 */
const ACTIVITY_INFO_FORM_LANGUAGE = RegistrationPreferredLanguage.en;

@Injectable()
export class ActivityInfoService {
  @InjectRepository(ActivityInfoEntity)
  private readonly activityInfoRepository: Repository<ActivityInfoEntity>;

  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  constructor(
    private readonly activityInfoApiService: ActivityInfoApiService,
    private readonly activityInfoValidationService: ActivityInfoValidationService,
    private readonly activityInfoFieldProcessorService: ActivityInfoFieldProcessorService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly programService: ProgramService,
    private readonly programRepository: ProgramRepository,
    private readonly programRegistrationAttributesService: ProgramRegistrationAttributesService,
  ) {}

  public async getActivityInfoData({
    programId,
  }: {
    programId: number;
  }): Promise<ActivityInfoResponseDto> {
    const activityInfoEntity = await this.activityInfoRepository.findOne({
      where: { programId: Equal(programId) },
    });

    if (!activityInfoEntity) {
      throw new HttpException(
        'ActivityInfo data not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return ActivityInfoEntityMapper.mapEntityToDto(activityInfoEntity);
  }

  public async integrateActivityInfo({
    programId,
    formId,
    token,
    url,
    dryRun,
  }: {
    programId: number;
    formId: string;
    token: string;
    url: string;
    dryRun: boolean;
  }): Promise<{ message: string; dryRun: boolean; name: string | null }> {
    await this.programService.findProgramOrThrow(programId);

    const fspConfigCount = await this.programFspConfigurationRepository.count({
      where: { programId: Equal(programId) },
    });
    if (fspConfigCount < 1) {
      throw new HttpException(
        'Program needs to have at least one FSP configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const formDefinition = await this.getFormDefinitionOrThrow({
      formId,
      token,
      url,
    });

    await this.activityInfoValidationService.validateActivityInfoFormDefinition({
      formDefinition,
      programId,
    });

    if (dryRun) {
      return {
        message: 'Dry run successful - validation passed',
        name: formDefinition.name,
        dryRun: true,
      };
    }

    await this.upsertActivityInfoEntity({
      formDefinition,
      programId,
      formId,
      token,
      url,
      name: formDefinition.name,
    });

    await this.updateProgramWithActivityInfoForm({ formDefinition, programId });

    return {
      message: 'ActivityInfo form integrated successfully',
      name: formDefinition.name,
      dryRun: false,
    };
  }

  public async refreshActivityInfoForm({
    programId,
  }: {
    programId: number;
  }): Promise<{ name: string | null; updated: boolean }> {
    const activityInfoIntegration = await this.activityInfoRepository.findOne({
      where: { programId: Equal(programId) },
    });

    if (!activityInfoIntegration) {
      throw new HttpException(
        'No ActivityInfo integration found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    const formDefinition = await this.getFormDefinitionOrThrow({
      formId: activityInfoIntegration.formId,
      token: activityInfoIntegration.token,
      url: activityInfoIntegration.url,
    });

    if (formDefinition.schemaVersion === activityInfoIntegration.schemaVersion) {
      return { name: formDefinition.name, updated: false };
    }

    await this.applyFormDefinitionToProgram({
      formDefinition,
      programId,
      currentSchemaVersion: activityInfoIntegration.schemaVersion,
    });

    return { name: formDefinition.name, updated: true };
  }

  public async applyFormDefinitionToProgram({
    formDefinition,
    programId,
    currentSchemaVersion,
  }: {
    formDefinition: ActivityInfoFormDefinition;
    programId: number;
    currentSchemaVersion: string;
  }): Promise<void> {
    await this.activityInfoValidationService.validateActivityInfoFormDefinition({
      formDefinition,
      programId,
    });

    await this.updateProgramWithActivityInfoForm({ formDefinition, programId });

    await this.activityInfoRepository.update(
      { programId, schemaVersion: currentSchemaVersion },
      {
        schemaVersion: formDefinition.schemaVersion,
        name: formDefinition.name,
      },
    );
  }

  public async getFormDefinitionOrThrow({
    formId,
    token,
    url,
  }: {
    formId: string;
    token: string;
    url: string;
  }): Promise<ActivityInfoFormDefinition> {
    const formSchema = await this.activityInfoApiService.getFormSchemaOrThrow({
      formId,
      token,
      baseUrl: url,
    });

    return ActivityInfoFormDefinitionMapper.formSchemaDtoToFormDefinition({
      formSchema,
    });
  }

  public async updateProgramWithActivityInfoForm({
    formDefinition,
    programId,
  }: {
    formDefinition: ActivityInfoFormDefinition;
    programId: number;
  }): Promise<void> {
    await this.renameAttributesWhoseFieldCodeChanged({
      fields: formDefinition.fields,
      programId,
    });

    await this.upsertProgramAttributesFromFormDefinition({
      fields: formDefinition.fields,
      programId,
      languageIsoCode: ACTIVITY_INFO_FORM_LANGUAGE,
    });

    await this.addLanguageToProgram({
      languageIsoCode: ACTIVITY_INFO_FORM_LANGUAGE,
      programId,
    });
  }

  /**
   * 121 keys its mapping on the immutable ActivityInfo field id, while the
   * registration attribute itself is named after the field code. When a code is
   * renamed in ActivityInfo, the existing attribute is renamed here so the
   * upsert that follows updates it instead of creating a second attribute and
   * orphaning the collected data.
   */
  private async renameAttributesWhoseFieldCodeChanged({
    fields,
    programId,
  }: {
    fields: ActivityInfoFieldCleaned[];
    programId: number;
  }): Promise<void> {
    const existingAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: {
          programId: Equal(programId),
          activityInfoFieldId: Not(IsNull()),
        },
      });

    if (existingAttributes.length === 0) {
      return;
    }

    const fieldCodesByFieldId = new Map(
      fields
        .filter((field) => field.code)
        .map((field) => [field.id, field.code as string]),
    );

    const attributesToRename = existingAttributes.filter((attribute) => {
      const currentFieldCode = fieldCodesByFieldId.get(
        attribute.activityInfoFieldId as string,
      );
      return currentFieldCode && currentFieldCode !== attribute.name;
    });

    for (const attribute of attributesToRename) {
      attribute.name = fieldCodesByFieldId.get(
        attribute.activityInfoFieldId as string,
      ) as string;
    }

    await this.programRegistrationAttributeRepository.save(attributesToRename);
  }

  private async upsertProgramAttributesFromFormDefinition({
    fields,
    programId,
    languageIsoCode,
  }: {
    fields: ActivityInfoFieldCleaned[];
    programId: number;
    languageIsoCode: RegistrationPreferredLanguage;
  }): Promise<void> {
    const programRegistrationAttributes =
      this.activityInfoFieldProcessorService.fieldsToProgramRegistrationAttributes(
        {
          fields,
          languageIsoCode,
        },
      );

    // Registration view attributes are already part of RegistrationViewEntity
    const isNotRegistrationViewAttribute = (attribute: { name: string }) =>
      !ACTIVITY_INFO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES[attribute.name];

    // 'fsp' is a special field used to resolve the programFspConfigurationName
    // of an imported record, not a registration attribute of its own
    const isNotFsp = (attribute: { name: string }) =>
      attribute.name !== fspFieldCode;

    const attributesToUpsert = programRegistrationAttributes
      .filter(isNotRegistrationViewAttribute)
      .filter(isNotFsp);

    await this.programRegistrationAttributesService.upsertProgramRegistrationAttributes(
      {
        programId,
        programRegistrationAttributes: attributesToUpsert,
      },
    );
  }

  private async addLanguageToProgram({
    languageIsoCode,
    programId,
  }: {
    languageIsoCode: RegistrationPreferredLanguage;
    programId: number;
  }): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);

    const combinedLanguages = [
      ...new Set([...program.languages, languageIsoCode]),
    ];

    await this.programService.updateProgram(programId, {
      languages: combinedLanguages,
    });
  }


  private async upsertActivityInfoEntity({
    formDefinition,
    programId,
    formId,
    token,
    url,
    name,
  }: {
    formDefinition: ActivityInfoFormDefinition;
    programId: number;
    formId: string;
    token: string;
    url: string;
    name: string | null;
  }): Promise<void> {
    const existingActivityInfoEntity =
      await this.activityInfoRepository.findOne({
        where: { programId: Equal(programId) },
      });

    const entityData = ActivityInfoEntityMapper.formDefinitionToEntity({
      formDefinition,
      programId,
      formId,
      token,
      url,
      name,
    });

    if (existingActivityInfoEntity) {
      Object.assign(existingActivityInfoEntity, entityData);
      await this.activityInfoRepository.save(existingActivityInfoEntity);
      return;
    }

    const activityInfoEntity = this.activityInfoRepository.create(entityData);
    await this.activityInfoRepository.save(activityInfoEntity);
  }
}
