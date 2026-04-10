import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { ImportExistingSubmissionsResultDto } from '@121-service/src/kobo/dtos/import-existing-submissions-result.dto';
import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboRegistrationInput } from '@121-service/src/kobo/interfaces/kobo-registration-input.interface';
import { KoboSubmissionMapper } from '@121-service/src/kobo/mappers/kobo-submission.mapper';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import {
  MAX_IMPORT_RECORDS,
  RegistrationsCreationService,
} from '@121-service/src/registration/services/registrations-creation.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';

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
    private readonly registrationsInputValidator: RegistrationsInputValidator,
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

  public async importNewSubmissions({
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
      await this.updateProgramToNewVersionIfApplicable({
        currentVersion: koboIntegration.versionId,
        currentVersionDateDeployed: koboIntegration.dateDeployed,
        formVersionFromIncomingSubmission:
          submissionWithDifferentVersion.__version__,
        assetUid: koboIntegration.assetUid,
        token: koboIntegration.token,
        url: koboIntegration.url,
        programId: koboIntegration.program.id,
      });
    }

    const submissionUuids = submissions.map((s) => s._uuid);

    const existingReferenceIds =
      await this.getExistingReferenceIds(submissionUuids);

    const newSubmissions = submissions.filter(
      (submission) => !existingReferenceIds.has(submission._uuid),
    );

    const registrationDataArray = newSubmissions.map((submission) =>
      KoboSubmissionMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      }),
    );

    return this.validateImportAndBuildResult({
      registrationDataArray,
      program: koboIntegration.program,
      userId,
      numberOfSubmissionsOnForm: count,
      numberOfSubmissionsSkipped: existingReferenceIds.size,
    });
  }

  private async validateImportAndBuildResult({
    registrationDataArray,
    program,
    userId,
    numberOfSubmissionsOnForm,
    numberOfSubmissionsSkipped,
  }: {
    registrationDataArray: KoboRegistrationInput[];
    program: ProgramEntity;
    userId: number;
    numberOfSubmissionsOnForm: number;
    numberOfSubmissionsSkipped: number;
  }): Promise<ImportExistingSubmissionsResultDto> {
    const { validRegistrations, errors: validationErrors } =
      await this.registrationsInputValidator.validateAndCleanInput({
        registrationInputArray: registrationDataArray,
        programId: program.id,
        userId,
        typeOfInput: RegistrationValidationInputType.create,
        validationConfig: {
          validateExistingReferenceId: true,
        },
      });

    const { aggregateImportResult } =
      await this.registrationsCreationService.importValidatedRegistrations({
        validatedImportRecords: validRegistrations,
        program,
        userId,
      });

    // The Kobo error DTO does not include validator-only fields such as index.
    // Map the validator errors to only the fields returned in the response.
    const validationErrorDtos = validationErrors.map((validationError) => ({
      referenceId: validationError.referenceId ?? '',
      column: validationError.column,
      error: validationError.error,
    }));

    const failedReferenceIds = new Set(
      validationErrorDtos.map((e) => e.referenceId),
    );

    return {
      numberOfSubmissionsOnForm,
      numberOfSubmissionsImported: aggregateImportResult.countImported,
      numberOfSubmissionsSkipped,
      numberOfSubmissionsFailed: failedReferenceIds.size,
      validationErrors: validationErrorDtos,
    };
  }

  private async getExistingReferenceIds(
    referenceIds: string[],
  ): Promise<Set<string>> {
    if (referenceIds.length === 0) {
      return new Set();
    }
    const registrations = await this.registrationRepository.find({
      where: { referenceId: In(referenceIds) },
      select: { referenceId: true },
    });
    return new Set(registrations.map((r) => r.referenceId));
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
