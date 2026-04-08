import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { ImportExistingSubmissionsResultDto } from '@121-service/src/kobo/dtos/import-existing-submissions-result.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboRegistrationInput } from '@121-service/src/kobo/interfaces/kobo-registration-input.interface';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';
import { RegistrationsCreationService } from '@121-service/src/registration/services/registrations-creation.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';

@Injectable()
export class KoboSubmissionHelperService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  constructor(
    private readonly koboService: KoboService,
    private readonly registrationsCreationService: RegistrationsCreationService,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
  ) {}

  public async updateProgramToNewVersionIfApplicable({
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

    // We expect that, most of the time, the incoming submission will be for the same version as the current one or for a newer version.
    // However, if we receive a submission for an older version (for example, because Kobo is retrying a submission that previously failed),
    // we do not update the program to that older version, to avoid removing program languages that were added later.
    // We still allow the submission to proceed as normal. If there are required attributes in the older version that are not in the program,
    // an error will be thrown during registration creation, will show up in the Kobo REST API service, and will need to be resolved by a human.
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
      { versionId: currentVersion, programId },
      {
        versionId: formVersionFromIncomingSubmission,
        dateDeployed: formDeployedDateOfIncomingSubmission,
      },
    );
  }

  public async getExistingReferenceIds(
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

  public async validateAndImportAsRegistrations({
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

    // Kobo submissions always have a referenceId (derived from the Kobo _uuid).
    // The shared validator types it as optional because other callers (e.g. CSV
    // import) may not provide one. This assertion narrows the type so downstream
    // code can rely on referenceId being present.
    this.assertErrorsHaveReferenceId(validationErrors);

    const { aggregateImportResult } =
      await this.registrationsCreationService.importValidatedRegistrations({
        validatedImportRecords: validRegistrations,
        program,
        userId,
      });

    // The validator error object may include `index` (row number) and `value`,
    // but those fields are intentionally omitted from
    // ImportExistingSubmissionsResultDto.validationErrors.
    const validationErrorDtos = validationErrors.map((validationError) => ({
      referenceId: validationError.referenceId,
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

  private assertErrorsHaveReferenceId(
    errors: ValidateRegistrationErrorObject[],
  ): asserts errors is (ValidateRegistrationErrorObject & {
    referenceId: string;
  })[] {
    const missing = errors.find((e) => e.referenceId == null);
    if (missing) {
      throw new Error(
        `Expected referenceId on all Kobo validation errors, but column '${missing.column}' had none`,
      );
    }
  }
}
