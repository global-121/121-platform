import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';
import { KoboLanguageMapper } from '@121-service/src/kobo/mappers/kobo-language.mapper';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSurveyProcessorService } from '@121-service/src/kobo/services/kobo-survey-processor.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

@Injectable()
export class KoboService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly koboApiService: KoboApiService,
    private readonly koboValidationService: KoboValidationService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly koboSurveyProcessorService: KoboSurveyProcessorService,
    private readonly programService: ProgramService,
    private readonly programRepository: ProgramRepository,
  ) {}

  public async getKoboData({
    programId,
  }: {
    programId: number;
  }): Promise<KoboResponseDto> {
    const koboEntity = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });
    if (!koboEntity) {
      throw new HttpException('Kobo data not found', HttpStatus.NOT_FOUND);
    }
    return KoboMapper.mapEntityToDto(koboEntity);
  }

  public async integrateKobo({
    programId,
    assetUid,
    token,
    url,
    dryRun,
  }: {
    programId: number;
    assetUid: string;
    token: string;
    url: string;
    dryRun: boolean;
  }): Promise<{
    message: string;
    dryRun: boolean;
    name: string | null;
  }> {
    await this.programService.findProgramOrThrow(programId);
    const fspConfigs = await this.programFspConfigurationRepository.count({
      where: { programId: Equal(programId) },
    });
    if (fspConfigs < 1) {
      throw new HttpException(
        'Program needs to have at least one FSP configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const asset = await this.koboApiService.getDeployedAssetOrThrow({
      assetUid,
      token,
      baseUrl: url,
    });

    const formDefinition = KoboMapper.koboAssetDtoToKoboFormDefinition({
      asset,
    });

    await this.koboValidationService.validateKoboFormDefinition({
      formDefinition,
      programId,
    });

    if (dryRun) {
      return {
        message: 'Dry run successful - validation passed',
        name: asset.name ?? null,
        dryRun: true,
      };
    }

    await this.upsertKoboEntity({
      formDefinition,
      programId,
      assetUid,
      token,
      url,
      name: asset.name ?? null,
    });
    const languageIsoCodes = KoboLanguageMapper.getLanguageIsoCodes({
      koboLanguages: formDefinition.languages,
    });

    await this.upsertProgramAttributesFromKoboFormDefinition({
      koboSurveyItems: formDefinition.survey,
      programId,
      languageIsoCodes,
    });

    await this.addLanguagesToProgram({
      languageIsoCodes,
      programId,
    });

    return {
      message: 'Kobo form integrated successfully',
      name: asset.name ?? null,
      dryRun: false,
    };
  }

  private async upsertKoboEntity({
    formDefinition,
    programId,
    assetUid,
    token,
    url,
    name,
  }: {
    formDefinition: KoboFormDefinition;
    programId: number;
    assetUid: string;
    token: string;
    url: string;
    name: string | null;
  }): Promise<void> {
    const existingKoboEntity = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });

    const entityData = KoboMapper.formDefinitionToEntity({
      formDefinition,
      programId,
      assetUid,
      token,
      url,
      name,
    });

    if (existingKoboEntity) {
      Object.assign(existingKoboEntity, entityData);
      await this.koboRepository.save(existingKoboEntity);
    } else {
      const koboEntity = this.koboRepository.create(entityData);
      await this.koboRepository.save(koboEntity);
    }
  }

  private async upsertProgramAttributesFromKoboFormDefinition({
    koboSurveyItems,
    programId,
    languageIsoCodes,
  }: {
    koboSurveyItems: KoboSurveyItemCleaned[];
    programId: number;
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): Promise<void> {
    const programRegistrationAttributes =
      this.koboSurveyProcessorService.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

    await this.programService.upsertProgramRegistrationAttributes({
      programId,
      programRegistrationAttributes,
    });
  }

  private async addLanguagesToProgram({
    languageIsoCodes,
    programId,
  }: {
    languageIsoCodes: RegistrationPreferredLanguage[];
    programId: number;
  }): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);

    const combinedLanguages = [
      ...new Set([...program.languages, ...languageIsoCodes]),
    ];
    await this.programService.updateProgram(programId, {
      languages: combinedLanguages,
    });
  }
}
