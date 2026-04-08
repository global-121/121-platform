import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ImportExistingSubmissionsResultDto } from '@121-service/src/kobo/dtos/import-existing-submissions-result.dto';
import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboSubmissionMapper } from '@121-service/src/kobo/mappers/kobo-submission.mapper';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSubmissionHelperService } from '@121-service/src/kobo/services/kobo-submission.helper.service';
import {
  MAX_IMPORT_RECORDS,
  RegistrationsCreationService,
} from '@121-service/src/registration/services/registrations-creation.service';

@Injectable()
export class KoboSubmissionService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly koboApiService: KoboApiService,
    private readonly registrationsCreationService: RegistrationsCreationService,
    private readonly koboSubmissionHelperService: KoboSubmissionHelperService,
  ) {}

  public async processKoboWebhookCall(
    koboWebhookIncomingSubmission: KoboWebhookIncomingSubmission,
  ): Promise<void> {
    const koboIntegration = await this.koboRepository.findOne({
      where: {
        assetUid: Equal(koboWebhookIncomingSubmission._xform_id_string),
      },
      select: {
        id: true,
        assetUid: true,
        versionId: true,
        token: true,
        url: true,
        dateDeployed: true,
      },
      relations: { program: true },
    });
    this.assertKoboIntegrationExistsOrThrow(koboIntegration);

    await this.koboSubmissionHelperService.updateProgramToNewVersionIfApplicable(
      {
        currentVersion: koboIntegration.versionId,
        currentVersionDateDeployed: koboIntegration.dateDeployed,
        formVersionFromIncomingSubmission:
          koboWebhookIncomingSubmission.__version__,
        assetUid: koboIntegration.assetUid,
        token: koboIntegration.token,
        url: koboIntegration.url,
        programId: koboIntegration.program.id,
      },
    );

    const submission = await this.koboApiService.getSubmission({
      token: koboIntegration.token,
      assetId: koboIntegration.assetUid,
      baseUrl: koboIntegration.url,
      submissionUuid: koboWebhookIncomingSubmission._uuid,
    });
    const registrationData =
      KoboSubmissionMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      });

    await this.registrationsCreationService.importRegistrations({
      inputRegistrations: [registrationData],
      program: koboIntegration.program,
      userId: null,
    });
  }

  public async importExistingSubmissions({
    programId,
    userId,
  }: {
    programId: number;
    userId: number;
  }): Promise<ImportExistingSubmissionsResultDto> {
    const koboIntegration = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
      select: {
        id: true,
        assetUid: true,
        versionId: true,
        dateDeployed: true,
        token: true,
        url: true,
      },
      relations: { program: true },
    });
    this.assertKoboIntegrationExistsOrThrow(koboIntegration);

    const { submissions, count } =
      await this.koboApiService.getSubmissionsUpToLimit({
        token: koboIntegration.token,
        assetUid: koboIntegration.assetUid,
        baseUrl: koboIntegration.url,
        limit: MAX_IMPORT_RECORDS,
      });

    if (count > MAX_IMPORT_RECORDS) {
      throw new HttpException(
        `The Kobo form has ${count} total submissions, which exceeds the maximum of ${MAX_IMPORT_RECORDS} that can be fetched at once. Not all submissions could be retrieved, so some new ones may be missing. Please use the CSV import instead and split the data into smaller batches.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const submissionWithDifferentVersion = submissions.find(
      (s) => s.__version__ !== koboIntegration.versionId,
    );

    if (submissionWithDifferentVersion) {
      await this.koboSubmissionHelperService.updateProgramToNewVersionIfApplicable(
        {
          currentVersion: koboIntegration.versionId,
          currentVersionDateDeployed: koboIntegration.dateDeployed,
          formVersionFromIncomingSubmission:
            submissionWithDifferentVersion.__version__,
          assetUid: koboIntegration.assetUid,
          token: koboIntegration.token,
          url: koboIntegration.url,
          programId: koboIntegration.program.id,
        },
      );
    }

    const submissionUuids = submissions.map((s) => s._uuid);

    const existingReferenceIds =
      await this.koboSubmissionHelperService.getExistingReferenceIds(
        submissionUuids,
      );

    const newSubmissions = submissions.filter(
      (submission) => !existingReferenceIds.has(submission._uuid),
    );

    const registrationDataArray = newSubmissions.map((submission) =>
      KoboSubmissionMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      }),
    );

    return this.koboSubmissionHelperService.validateAndImportAsRegistrations({
      registrationDataArray,
      program: koboIntegration.program,
      userId,
      numberOfSubmissionsOnForm: count,
      numberOfSubmissionsSkipped: existingReferenceIds.size,
    });
  }

  private assertKoboIntegrationExistsOrThrow<T extends Partial<KoboEntity>>(
    koboIntegration: T | null,
  ): asserts koboIntegration is T {
    if (!koboIntegration) {
      throw new HttpException(
        'Kobo integration not found for this program',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
