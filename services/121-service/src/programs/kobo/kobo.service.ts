import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { EXTERNAL_API } from '@121-service/src/config';
import { KoboLinkFormResponseDto } from '@121-service/src/programs/kobo/dto/kobo-link-form-reponse.dto';
import { KoboResponseDto } from '@121-service/src/programs/kobo/dto/kobo-response.dto';
import { KoboWebhookIncomingSubmission } from '@121-service/src/programs/kobo/dto/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/programs/kobo/enitities/kobo.entity';
import { KoboApiService } from '@121-service/src/programs/kobo/kobo-api-service';
import { KoboFormService } from '@121-service/src/programs/kobo/kobo-form.service';
import { KoboFormValidationService } from '@121-service/src/programs/kobo/kobo-form-validation.service';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';

export const KOBO_WEBHOOK_121_ENDPOINT = `${EXTERNAL_API.baseApiUrl}kobo/webhook`;

export const KOBO_WEBHOOK_SUBSET_FIELDS = ['_uuid', '_xform_id_string'];
@Injectable()
export class KoboService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly koboApiService: KoboApiService,
    private readonly koboFormService: KoboFormService,
    private readonly koboFormValidationService: KoboFormValidationService,
  ) {}

  public async getKoboIntegration(programId: number): Promise<KoboResponseDto> {
    const koboEntity = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
      select: {
        assetId: true,
        tokenCode: false, // Don't expose the token code
        url: true,
        versionId: true,
        dateDeployed: true,
      },
    });
    if (!koboEntity) {
      throw new HttpException(
        'Kobo integration not found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    return koboEntity;
  }

  public async createKoboIntegration({
    koboToken,
    koboAssetId,
    koboUrl,
    programId,
    dryRun,
  }: {
    koboToken: string;
    koboAssetId: string;
    koboUrl: string;
    programId: number;
    dryRun: boolean;
  }): Promise<KoboLinkFormResponseDto> {
    await this.throwIfProgramAlreadyHasKoboIntegration(programId);

    const koboInformation = await this.koboApiService.getKoboInformation(
      koboToken,
      koboAssetId,
      koboUrl,
    );

    await this.koboFormValidationService.validateKoboForm({
      koboInformation,
      programId,
    });

    if (dryRun) {
      return { name: koboInformation.name };
    }
    console.log('🚀 ~ KoboService ~ koboInformation:', koboInformation);

    await this.createWebhookIfNotExists({ koboUrl, koboToken, koboAssetId });

    await this.createKoboEntity({
      assetId: koboAssetId,
      tokenCode: koboToken,
      programId,
      versionId: koboInformation.versionId,
      dateDeployed: koboInformation.dateDeployed,
      koboUrl,
    });

    await this.koboFormService.processKoboSurvey(koboInformation, programId);

    return { name: koboInformation.name };
  }

  public async processKoboWebhookCall(
    koboWebhookIncomingSubmission: KoboWebhookIncomingSubmission,
  ): Promise<void> {
    console.log(
      '🚀 ~ KoboService ~ koboWebhookIncomingSubmission:',
      koboWebhookIncomingSubmission,
    );

    const koboEntity = await this.koboRepository.findOne({
      where: { assetId: Equal(koboWebhookIncomingSubmission._xform_id_string) },
      select: {
        id: true,
        programId: true,
        versionId: true,
        tokenCode: true,
        url: true,
      },
    });
    if (!koboEntity) {
      throw new HttpException(
        'Kobo integration not found for this program',
        HttpStatus.NOT_FOUND,
      );
    }
    const programId = koboEntity.programId;

    const submission = await this.getSubmissionByReference(
      koboWebhookIncomingSubmission._uuid,
      koboWebhookIncomingSubmission._xform_id_string,
      koboEntity.tokenCode,
      koboEntity.url,
    );
    console.log('🚀 ~ KoboService ~ submission:', submission);

    if (submission.__version__ !== koboEntity.versionId) {
      await this.updateIfNewDeployedVersion({
        programId: koboEntity.programId,
      });
    }

    const mappedKoboDataForImport = this.mapKoboDataFor121Import([submission]);

    await this.registrationsService.importRegistrationsFromJson(
      mappedKoboDataForImport,
      programId,
      1, // Should use actual user id
    );
  }

  private async updateIfNewDeployedVersion({
    programId,
  }: {
    programId: number;
  }): Promise<void> {
    const existingKoboEntity = await this.koboRepository.findOneOrFail({
      where: { programId: Equal(programId) },
      select: {
        id: true,
        versionId: true,
        dateDeployed: true,
        tokenCode: true,
        assetId: true,
        url: true,
      },
    });
    const latestDeployedKoboForm = await this.koboApiService.getKoboInformation(
      existingKoboEntity.tokenCode,
      existingKoboEntity.assetId,
      existingKoboEntity.url,
    );
    if (latestDeployedKoboForm.versionId !== existingKoboEntity.versionId) {
      await this.koboRepository.update(
        { id: existingKoboEntity.id },
        {
          versionId: latestDeployedKoboForm.versionId,
          dateDeployed: latestDeployedKoboForm.dateDeployed,
        },
      );

      await this.koboFormService.processKoboSurvey(
        latestDeployedKoboForm,
        programId,
      );
    }
  }

  private async throwIfProgramAlreadyHasKoboIntegration(
    programId: number,
  ): Promise<void> {
    const existingKobo = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });
    if (existingKobo) {
      throw new HttpException(
        'Program already has a Kobo integration',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async getSubmissionByReference(
    submissionUuid: string,
    koboAssetId: string,
    koboToken: string,
    koboUrl: string,
  ): Promise<Record<string, string>> {
    const submissions = await this.koboApiService.getSubmissions({
      token: koboToken,
      assetId: koboAssetId,
      baseUrl: koboUrl,
      submissionUuid,
    });
    // check if submision length is 1 and uuid is same as the one in the webhook
    if (submissions.length !== 1) {
      throw new HttpException(
        `Expected 1 submission but got ${submissions.length}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const submission = submissions[0];
    if (submission._uuid !== submissionUuid) {
      throw new HttpException(
        `Expected submission UUID ${submissionUuid} but got ${submission._uuid}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return submission;
  }

  private async createWebhookIfNotExists({
    koboUrl,
    koboToken,
    koboAssetId,
  }: {
    koboUrl: string;
    koboToken: string;
    koboAssetId: string;
  }): Promise<void> {
    const existingWebhooks = await this.koboApiService.getExistingKoboWebhooks(
      koboToken,
      koboAssetId,
      koboUrl,
    );
    console.log('🚀 ~ KoboService ~ existingWebhooks:', existingWebhooks);

    const existing121Webhooks = existingWebhooks.filter(
      (webhook) => webhook.endpoint === KOBO_WEBHOOK_121_ENDPOINT,
    );
    if (existing121Webhooks.length === 0) {
      console.log(
        '🚀 ~ KoboService ~ existing121Webhooks:',
        existing121Webhooks,
      );
      await this.koboApiService.createKoboWebhook(
        koboToken,
        koboAssetId,
        koboUrl,
      );
    }
    if (existingWebhooks.length > 1) {
      throw new HttpException(
        `Multiple webhooks found for the same assetId names ${existingWebhooks
          .map((webhook) => webhook.name)
          .join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existingWebhooks.length === 1) {
      // Check if the existing webhook has the same subset fields
      const existingWebhook = existingWebhooks[0];
      const hasSameSubsetFields = KOBO_WEBHOOK_SUBSET_FIELDS.every((field) =>
        existingWebhook.subset_fields.includes(field),
      );
      if (!hasSameSubsetFields) {
        throw new HttpException(
          `Existing webhook has different subset fields: ${existingWebhook.subset_fields.join(
            ', ',
          )}. Expected: ${KOBO_WEBHOOK_SUBSET_FIELDS.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  public async importKoboSubmissionsAsRegistrations(
    programId: number,
  ): Promise<void> {
    // Get the kobo entity for this program
    const koboEntity = await this.koboRepository.findOneOrFail({
      where: { programId: Equal(programId) },
    });

    const rawKoboSumissions = await this.koboApiService.getSubmissions({
      token: koboEntity.tokenCode,
      assetId: koboEntity.assetId,
      baseUrl: koboEntity.url,
    });

    if (
      await this.atleastOneKoboSubmissionHasDifferentVersion(
        rawKoboSumissions,
        koboEntity.versionId,
      )
    ) {
      await this.updateIfNewDeployedVersion({
        programId: koboEntity.programId,
      });
    }
    // Check if the kobo submission data is empty

    const mappedKoboDataForImport =
      this.mapKoboDataFor121Import(rawKoboSumissions);

    await this.registrationsService.importRegistrationsFromJson(
      mappedKoboDataForImport,
      programId,
      1, // Should use actual user id
    );

    return;
  }

  private async atleastOneKoboSubmissionHasDifferentVersion(
    koboSubmissions: Record<string, string>[],
    currentStoredVersion: string,
  ): Promise<boolean> {
    for (const submission of koboSubmissions) {
      if (submission.__version__ !== currentStoredVersion) {
        return true;
      }
    }
    return false;
  }

  private mapKoboDataFor121Import(
    koboData: Record<string, string>[],
  ): Record<string, string | boolean | number>[] {
    const mappedItems: Record<string, string | boolean | number>[] = [];
    for (const record of koboData) {
      const mappedItem = this.mapKoboDataItemTo121Import(record);
      mappedItems.push(mappedItem);
    }
    return mappedItems;
  }
  /**
   * Maps a Kobo data record to a 121 registration format
   */
  private mapKoboDataItemTo121Import(
    koboDataRecord: Record<string, string>,
  ): Record<string, string | boolean | number> {
    const mappedItem: Record<string, string | boolean | number> = {};

    Object.entries(koboDataRecord).forEach(([key, value]) => {
      if (this.shouldProcessKoboKey(key)) {
        const mappedKey = this.getMappedKeyName(key);
        mappedItem[mappedKey] = value;
      }
    });

    return mappedItem;
  }

  /**
   * Determines if a key from Kobo should be processed or ignored
   */
  private shouldProcessKoboKey(key: string): boolean {
    return !this.getIgnoredKeys().includes(key);
  }

  private getIgnoredKeys(): string[] {
    return [
      '_id',
      'formhub/uuid',
      'start',
      'end',
      '__version__',
      'meta/instanceID',
      '_xform_id_string',
      '_uuid',
      '_attachments',
      '_status',
      '_geolocation',
      '_submission_time',
      '_tags',
      '_notes',
      '_validation_status',
      '_submitted_by',
    ];
  }

  private getMappedKeyName(key: string): string {
    if (key === '_uuid') {
      return 'referenceId';
    }

    if (key.includes('/')) {
      const parts = key.split('/');
      return parts[parts.length - 1];
    }

    return key;
  }

  private async createKoboEntity({
    assetId,
    tokenCode,
    programId,
    versionId,
    dateDeployed,
    koboUrl,
  }: {
    assetId: string;
    tokenCode: string;
    programId: number;
    versionId: string;
    dateDeployed: Date;
    koboUrl: string;
  }): Promise<KoboEntity> {
    const koboEntity = new KoboEntity();
    koboEntity.assetId = assetId;
    koboEntity.tokenCode = tokenCode;
    koboEntity.programId = programId;
    koboEntity.dateDeployed = dateDeployed;
    koboEntity.versionId = versionId;
    koboEntity.url = koboUrl;

    return await this.koboRepository.save(koboEntity);
  }
}
