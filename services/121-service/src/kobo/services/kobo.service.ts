import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { KoboIntegrationResultDto } from '@121-service/src/kobo/dtos/kobo-integration-result.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSurveyProcessorService } from '@121-service/src/kobo/services/kobo-survey-processor.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

@Injectable()
export class KoboService {
  // kobo repo typeorm import
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
    const koboData = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });
    if (!koboData) {
      throw new HttpException('Kobo data not found', HttpStatus.NOT_FOUND);
    }
    return KoboMapper.mapEntityToDto(koboData);
  }

  public async integrateKobo({
    programId,
    assetId,
    token,
    url,
    dryRun,
  }: {
    programId: number;
    assetId: string;
    token: string;
    url: string;
    dryRun: boolean;
  }): Promise<KoboIntegrationResultDto> {
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

    const koboFormDefinition =
      await this.koboApiService.getDeployedAssetOrThrow({
        assetId,
        token,
        baseUrl: url,
      });
    await this.koboValidationService.validateKoboFormDefinition({
      formDefinition: koboFormDefinition,
      programId,
    });

    if (dryRun) {
      return {
        message: 'Dry run successful - validation passed',
        dryRun: true,
      };
    }

    await this.upsertKoboEntity({
      koboFormDefinition,
      programId,
      assetId,
      token,
      url,
    });
    const languageIsoCodes = this.getLanguageIsoCodes({
      koboLanguages: koboFormDefinition.languages,
    });

    await this.upsertProgramAttributesFromKoboFormDefinition({
      koboFormDefinition,
      programId,
      languageIsoCodes,
    });

    await this.addLanguagesToProgram({
      languageIsoCodes,
      programId,
    });

    return {
      message: 'Kobo form integrated successfully',
      dryRun: false,
    };
  }

  public async upsertKoboEntity({
    koboFormDefinition,
    programId,
    assetId,
    token,
    url,
  }: {
    koboFormDefinition: KoboFormDefinition;
    programId: number;
    assetId: string;
    token: string;
    url: string;
  }): Promise<void> {
    const existingKoboEntity = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });

    if (existingKoboEntity) {
      existingKoboEntity.assetId = assetId;
      existingKoboEntity.token = token;
      existingKoboEntity.url = url;
      existingKoboEntity.dateDeployed = koboFormDefinition.dateDeployed;
      existingKoboEntity.versionId = koboFormDefinition.versionId;
      await this.koboRepository.save(existingKoboEntity);
    } else {
      const koboEntity = this.koboRepository.create({
        programId,
        assetId,
        token,
        url,
        dateDeployed: koboFormDefinition.dateDeployed,
        versionId: koboFormDefinition.versionId,
      });

      await this.koboRepository.save(koboEntity);
    }
  }

  private async upsertProgramAttributesFromKoboFormDefinition({
    koboFormDefinition,
    programId,
    languageIsoCodes,
  }: {
    koboFormDefinition: KoboFormDefinition;
    programId: number;
    languageIsoCodes: RegistrationPreferredLanguage[];
  }): Promise<void> {
    const programRegistrationAttributes =
      this.koboSurveyProcessorService.surveyToProgramRegistrationAttributes({
        koboSurvey: koboFormDefinition.survey,
        koboChoices: koboFormDefinition.choices,
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

  private getLanguageIsoCodes({
    koboLanguages: koboLanguages,
  }: {
    koboLanguages: string[];
  }): RegistrationPreferredLanguage[] {
    const isoCodes: RegistrationPreferredLanguage[] = [];
    for (const language of koboLanguages) {
      const isoCode = this.extractIsoCode({ koboSurveyLanguage: language });
      if (isoCode) {
        isoCodes.push(isoCode);
      }
    }
    return isoCodes;
  }

  private extractIsoCode({
    koboSurveyLanguage,
  }: {
    koboSurveyLanguage: string;
  }): RegistrationPreferredLanguage | undefined {
    for (const isoLanguageCode of Object.values(
      RegistrationPreferredLanguage,
    )) {
      if (koboSurveyLanguage.includes(`(${isoLanguageCode})`)) {
        return isoLanguageCode;
      }
    }
    return undefined;
  }
}
