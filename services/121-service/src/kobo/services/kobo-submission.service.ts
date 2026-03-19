import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboSubmissionMapper } from '@121-service/src/kobo/mappers/kobo-submission.mapper';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsCreationService } from '@121-service/src/registration/services/registrations-creation.service';

const MAX_SUBMISSIONS_TO_IMPORT = 1000;

@Injectable()
export class KoboSubmissionService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  constructor(
    private readonly koboApiService: KoboApiService,
    private readonly koboService: KoboService,
    private readonly registrationsCreationService: RegistrationsCreationService,
  ) {}

  public async importExistingSubmissions({
    programId,
    userId,
  }: {
    programId: number;
    userId: number;
  }): Promise<ImportResult> {
    const koboIntegration = await this.koboRepository.findOne({
      where: {
        programId: Equal(programId),
      },
      select: {
        id: true,
        assetUid: true,
        token: true,
        url: true,
      },
      relations: { program: true },
    });
    if (!koboIntegration) {
      throw new HttpException(
        'No Kobo integration found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    const allSubmissions = await this.koboApiService.getSubmissions({
      token: koboIntegration.token,
      assetId: koboIntegration.assetUid,
      baseUrl: koboIntegration.url,
      maxCount: MAX_SUBMISSIONS_TO_IMPORT,
    });

    const submissionUuids = allSubmissions.map((s) => s._uuid);

    const existingRegistrations = await this.registrationRepository.find({
      where: {
        referenceId: In(submissionUuids),
        programId: Equal(programId),
      },
      select: { referenceId: true },
    });
    const existingReferenceIds = new Set(
      existingRegistrations.map((r) => r.referenceId),
    );

    const newSubmissions = allSubmissions.filter(
      (s) => !existingReferenceIds.has(s._uuid),
    );

    if (newSubmissions.length === 0) {
      return {
        aggregateImportResult: {
          countImported: 0,
        },
      };
    }

    const inputRegistrations = newSubmissions.map((submission) =>
      KoboSubmissionMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      }),
    );

    return this.registrationsCreationService.importRegistrations({
      inputRegistrations,
      program: koboIntegration.program,
      userId,
    });
  }

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
    if (!koboIntegration) {
      throw new HttpException(
        'Kobo integration not found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.updateProgramToNewVersionIfApplicable({
      currentVersion: koboIntegration.versionId,
      currentVersionDateDeployed: koboIntegration.dateDeployed,
      formVersionFromIncomingSubmission:
        koboWebhookIncomingSubmission.__version__,
      assetUid: koboIntegration.assetUid,
      token: koboIntegration.token,
      url: koboIntegration.url,
      programId: koboIntegration.program.id,
    });

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

  private async updateProgramToNewVersionIfApplicable({
    currentVersion,
    currentVersionDateDeployed,
    formVersionFromIncomingSubmission,
    assetUid,
    token,
    url,
    programId,
  }: {
    currentVersion: string;
    currentVersionDateDeployed: Date;
    formVersionFromIncomingSubmission: string;
    assetUid: string;
    token: string;
    url: string;
    programId: number;
  }): Promise<void> {
    if (currentVersion === formVersionFromIncomingSubmission) {
      return;
    }

    if (IS_DEVELOPMENT) {
      // The mock service is stateless and cannot serve multiple real Kobo form versions.
      // Integration tests encode the target mock asset UID in __version__ so this service
      // fetches the correct mock asset instead of the original one.
      if (formVersionFromIncomingSubmission.includes('asset-')) {
        assetUid = `asset-${formVersionFromIncomingSubmission.split('asset-')[1]}`;
      }
    }

    const formDefinition = await this.koboService.getFormDefinitionOrThrow({
      assetUid,
      token,
      url,
    });

    // We would expect that most of the time, the incoming submission will be for the same version as the current one, or for a newer version.
    // But in case we receive a submission for an older version (e.g. because Kobo is retrying to send us a submission that previously failed),
    // We do not update the program to the older version to prevent for example removing the program languages that were added
    // We allow the submission to proceed as normal, in case there any required attributes in the older version that are not in the program
    // an error will be thrown during the registration creation which show up in the kobo rest api service and it has to be resolved by a human
    const formDeployedDateOfIncomingSubmission = new Date(
      formDefinition.dateDeployed,
    );
    if (formDeployedDateOfIncomingSubmission < currentVersionDateDeployed) {
      return;
    }

    await this.koboService.validateFormAndUpdateProgram({
      formDefinition,
      programId,
    });

    await this.koboRepository.update(
      { versionId: currentVersion },
      {
        versionId: formVersionFromIncomingSubmission,
        dateDeployed: formDeployedDateOfIncomingSubmission,
      },
    );
  }
}
