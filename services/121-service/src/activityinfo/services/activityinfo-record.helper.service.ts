import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ImportExistingRecordsResultDto } from '@121-service/src/activityinfo/dtos/import-existing-records-result.dto';
import { ActivityInfoRegistrationInput } from '@121-service/src/activityinfo/interfaces/activityinfo-registration-input.interface';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationValidationInputType } from '@121-service/src/registration/enum/registration-validation-input-type.enum';
import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';
import { RegistrationsCreationService } from '@121-service/src/registration/services/registrations-creation.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';

@Injectable()
export class ActivityInfoRecordHelperService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  constructor(
    private readonly registrationsCreationService: RegistrationsCreationService,
    private readonly registrationsInputValidator: RegistrationsInputValidator,
  ) {}

  public async filterAlreadyExistingRecordIds(
    recordIds: string[],
  ): Promise<Set<string>> {
    if (recordIds.length === 0) {
      return new Set();
    }

    const registrations = await this.registrationRepository.find({
      where: { referenceId: In(recordIds) },
      select: { referenceId: true },
    });

    return new Set(registrations.map((registration) => registration.referenceId));
  }

  public async validateAndImportAsRegistrations({
    registrationDataArray,
    program,
    userId,
    numberOfRecordsOnForm,
    numberOfRecordsSkipped,
  }: {
    registrationDataArray: ActivityInfoRegistrationInput[];
    program: ProgramEntity;
    userId: number;
    numberOfRecordsOnForm: number;
    numberOfRecordsSkipped: number;
  }): Promise<ImportExistingRecordsResultDto> {
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

    // An ActivityInfo record always has a referenceId, derived from its record
    // id. The shared validator types it as optional because other callers, such
    // as CSV import, may not provide one.
    this.assertErrorsHaveReferenceId(validationErrors);

    const { aggregateImportResult } =
      await this.registrationsCreationService.importValidatedRegistrations({
        validatedImportRecords: validRegistrations,
        program,
        userId,
      });

    const validationErrorDtos = validationErrors.map((validationError) => ({
      referenceId: validationError.referenceId,
      column: validationError.column,
      error: validationError.error,
    }));

    const failedReferenceIds = new Set(
      validationErrorDtos.map((validationError) => validationError.referenceId),
    );

    return {
      numberOfRecordsOnForm,
      numberOfRecordsImported: aggregateImportResult.countImported,
      numberOfRecordsSkipped,
      numberOfRecordsFailed: failedReferenceIds.size,
      validationErrors: validationErrorDtos,
    };
  }

  private assertErrorsHaveReferenceId(
    errors: ValidateRegistrationErrorObject[],
  ): asserts errors is (ValidateRegistrationErrorObject & {
    referenceId: string;
  })[] {
    const errorWithoutReferenceId = errors.find(
      (error) => error.referenceId == null,
    );

    if (errorWithoutReferenceId) {
      throw new Error(
        `Expected referenceId on all ActivityInfo validation errors, but column '${errorWithoutReferenceId.column}' had none`,
      );
    }
  }
}
