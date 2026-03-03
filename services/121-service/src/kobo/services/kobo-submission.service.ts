import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';

@Injectable()
export class KoboSubmissionService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly koboApiService: KoboApiService,
    private readonly koboService: KoboService,
    private readonly koboValidationService: KoboValidationService,
    private readonly registrationsImportService: RegistrationsImportService,
  ) {}

  public async processKoboWebhookCall(
    koboWebhookIncomingSubmission: KoboWebhookIncomingSubmission,
  ): Promise<void> {
    const koboEntity = await this.koboRepository.findOne({
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
    if (!koboEntity) {
      throw new HttpException(
        'Kobo integration not found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.updateProgramToNewVersionIfApplicable({
      currentVersion: koboEntity.versionId,
      currentVersionDateDeployed: koboEntity.dateDeployed,
      formVersionFromIncomingSubmission:
        koboWebhookIncomingSubmission.__version__,
      assetUid: koboEntity.assetUid,
      token: koboEntity.token,
      url: koboEntity.url,
      programId: koboEntity.program.id,
    });

    const submission = await this.koboApiService.getSubmission({
      token: koboEntity.token,
      assetId: koboEntity.assetUid,
      baseUrl: koboEntity.url,
      submissionUuid: koboWebhookIncomingSubmission._uuid,
    });
    const registrationData = KoboMapper.mapSubmissionToRegistrationData({
      koboSubmission: submission,
    });

    await this.registrationsImportService.importRegistrations({
      inputRegistrations: [registrationData],
      program: koboEntity.program,
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

    const asset = await this.koboApiService.getDeployedAssetOrThrow({
      assetUid,
      token,
      baseUrl: url,
    });

    const formDefinition = KoboMapper.koboAssetDtoToKoboFormDefinition({
      asset,
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

    await this.koboValidationService.validateKoboFormDefinition({
      formDefinition,
      programId,
    });

    await this.koboService.syncProgramWithKoboForm({
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
