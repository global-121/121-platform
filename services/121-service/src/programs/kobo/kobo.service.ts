import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { EXTERNAL_API } from '@121-service/src/config';
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

  public async getKoboIntegration(programId: number): Promise<KoboEntity> {
    const koboEntity = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
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
  }: {
    koboToken: string;
    koboAssetId: string;
    koboUrl: string;
    programId: number;
  }): Promise<void> {
    const koboInformation = await this.koboApiService.getKoboInformation(
      koboToken,
      koboAssetId,
      koboUrl,
    );

    const isNewVersion = await this.isNewKoboVersion(
      programId,
      koboInformation.versionId,
    );

    if (isNewVersion) {
      await this.koboFormValidationService.validateKoboForm({
        koboInformation,
        programId,
      });
    }

    await this.createWebhookIfNotExists({ koboUrl, koboToken, koboAssetId });

    await this.upsertKoboEntity({
      assetId: koboAssetId,
      tokenCode: koboToken,
      programId,
      versionId: koboInformation.versionId,
      dateDeployed: koboInformation.dateDeployed,
      koboUrl,
    });

    if (isNewVersion) {
      await this.koboFormService.processKoboSurvey(koboInformation, programId);
    }
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
        programId: true,
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

    const mappedKoboDataForImport = this.mapKoboDataFor121Import([submission]);

    await this.registrationsService.importRegistrationsFromJson(
      mappedKoboDataForImport,
      programId,
      1, // Should use actual user id
    );
  }

  private async getSubmissionByReference(
    submissionUuid: string,
    koboAssetId: string,
    koboToken: string,
    koboUrl: string,
  ): Promise<Record<string, string>> {
    const submissions = await this.koboApiService.getKoboSubmissionData({
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

  public async importKoboDataAsRegistrations(programId: number): Promise<void> {
    // Get the kobo entity for this program
    const koboEntity = await this.koboRepository.findOneOrFail({
      where: { programId: Equal(programId) },
    });

    const rawKoboSumissionData =
      await this.koboApiService.getKoboSubmissionData({
        token: koboEntity.tokenCode,
        assetId: koboEntity.assetId,
        baseUrl: koboEntity.url,
      });

    const mappedKoboDataForImport =
      this.mapKoboDataFor121Import(rawKoboSumissionData);

    await this.registrationsService.importRegistrationsFromJson(
      mappedKoboDataForImport,
      programId,
      1, // Should use actual user id
    );

    return;
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

  private async upsertKoboEntity({
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
    // Check if a Kobo entity already exists for this program
    const existingKobo = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });

    if (existingKobo) {
      if (existingKobo.assetId !== assetId) {
        throw new HttpException(
          'Cannot change assetId for an existing program',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (existingKobo.tokenCode !== tokenCode) {
        throw new HttpException(
          'Cannot change tokenCode for an existing program',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (existingKobo.url === koboUrl) {
        throw new HttpException(
          'Cannot change koboUrl for an existing program',
          HttpStatus.BAD_REQUEST,
        );
      }
      existingKobo.assetId = assetId;
      existingKobo.tokenCode = tokenCode;
      existingKobo.versionId = versionId;
      existingKobo.dateDeployed = dateDeployed;

      return await this.koboRepository.save(existingKobo);
    } else {
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

  private async isNewKoboVersion(
    programId: number,
    newVersionId: string,
  ): Promise<boolean> {
    const existingKobo = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });

    // It's a new version if:
    // 1. There is no existing Kobo entity for this program
    // 2. The version IDs are different
    return !existingKobo || existingKobo.versionId !== newVersionId;
  }
}
