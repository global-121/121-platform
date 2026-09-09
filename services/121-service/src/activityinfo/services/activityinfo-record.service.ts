import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { fspFieldCode } from '@121-service/src/activityinfo/consts/activityinfo-fsp-field.const';
import { ImportExistingRecordsResultDto } from '@121-service/src/activityinfo/dtos/import-existing-records-result.dto';
import { ActivityInfoEntity } from '@121-service/src/activityinfo/entities/activityinfo.entity';
import { resolveAttributeTypeForActivityInfoField } from '@121-service/src/activityinfo/helpers/activityinfo-attribute-type.helper';
import { ActivityInfoFieldCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-field-cleaned.interface';
import { ActivityInfoFormDefinition } from '@121-service/src/activityinfo/interfaces/activityinfo-form-definition.interface';
import {
  ActivityInfoFieldMapping,
  ActivityInfoRecordMapper,
} from '@121-service/src/activityinfo/mappers/activityinfo-record.mapper';
import { ActivityInfoService } from '@121-service/src/activityinfo/services/activityinfo.service';
import { ActivityInfoApiService } from '@121-service/src/activityinfo/services/activityinfo-api.service';
import { ActivityInfoRecordHelperService } from '@121-service/src/activityinfo/services/activityinfo-record.helper.service';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { MAX_REGISTRATION_IMPORT_ROWS_PER_UPLOAD } from '@121-service/src/shared/file-upload-row-limits';

@Injectable()
export class ActivityInfoRecordService {
  @InjectRepository(ActivityInfoEntity)
  private readonly activityInfoRepository: Repository<ActivityInfoEntity>;

  constructor(
    private readonly activityInfoApiService: ActivityInfoApiService,
    private readonly activityInfoService: ActivityInfoService,
    private readonly activityInfoRecordHelperService: ActivityInfoRecordHelperService,
  ) {}

  public async importExistingRecords({
    programId,
    userId,
  }: {
    programId: number;
    userId: number;
  }): Promise<ImportExistingRecordsResultDto> {
    const activityInfoIntegration = await this.activityInfoRepository.findOne({
      where: { programId: Equal(programId) },
      relations: { program: true },
    });

    if (!activityInfoIntegration) {
      throw new HttpException(
        'ActivityInfo integration not found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    const formDefinition =
      await this.activityInfoService.getFormDefinitionOrThrow({
        formId: activityInfoIntegration.formId,
        token: activityInfoIntegration.token,
        url: activityInfoIntegration.url,
      });

    // Importing against an outdated set of registration attributes would fail
    // validation for every record that uses a newly added field, so the program
    // is brought up to date with the current schema first.
    if (formDefinition.schemaVersion !== activityInfoIntegration.schemaVersion) {
      await this.activityInfoService.applyFormDefinitionToProgram({
        formDefinition,
        programId,
        currentSchemaVersion: activityInfoIntegration.schemaVersion,
      });
    }

    const fieldMappingsByFieldId = this.buildFieldMappings({ formDefinition });

    const records = await this.activityInfoApiService.getRecords({
      formId: activityInfoIntegration.formId,
      token: activityInfoIntegration.token,
      baseUrl: activityInfoIntegration.url,
      fieldIds: [...fieldMappingsByFieldId.keys()],
    });

    if (records.length > MAX_REGISTRATION_IMPORT_ROWS_PER_UPLOAD) {
      throw new HttpException(
        `The ActivityInfo form has ${records.length} records, which exceeds the maximum of ${MAX_REGISTRATION_IMPORT_ROWS_PER_UPLOAD} that can be imported at once. Please use the CSV import instead and split the data into smaller batches.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const registrationDataArray = records.map((record) =>
      ActivityInfoRecordMapper.mapRecordToRegistrationData({
        record,
        fieldMappingsByFieldId,
      }),
    );

    const existingReferenceIds =
      await this.activityInfoRecordHelperService.filterAlreadyExistingRecordIds(
        registrationDataArray.map(
          (registrationData) => registrationData.referenceId,
        ),
      );

    const newRegistrationDataArray = registrationDataArray.filter(
      (registrationData) =>
        !existingReferenceIds.has(registrationData.referenceId),
    );

    return this.activityInfoRecordHelperService.validateAndImportAsRegistrations(
      {
        registrationDataArray: newRegistrationDataArray,
        program: activityInfoIntegration.program,
        userId,
        numberOfRecordsOnForm: records.length,
        numberOfRecordsSkipped: existingReferenceIds.size,
      },
    );
  }

  /**
   * Builds the field id to registration attribute mapping used to translate a
   * record. Keyed by the immutable field id, because that is what 121 asks
   * ActivityInfo to name the record columns after.
   */
  private buildFieldMappings({
    formDefinition,
  }: {
    formDefinition: ActivityInfoFormDefinition;
  }): Map<string, ActivityInfoFieldMapping> {
    const fieldMappingsByFieldId = new Map<string, ActivityInfoFieldMapping>();

    for (const field of formDefinition.fields) {
      if (!field.code || !resolveAttributeTypeForActivityInfoField({ field })) {
        continue;
      }

      fieldMappingsByFieldId.set(field.id, {
        attributeName: this.resolveAttributeName({ field }),
        choices: field.choices,
      });
    }

    return fieldMappingsByFieldId;
  }

  private resolveAttributeName({
    field,
  }: {
    field: ActivityInfoFieldCleaned;
  }): string {
    // 'fsp' is the form-facing name for the FSP configuration to use, which the
    // registration itself stores as 'programFspConfigurationName'.
    const activityInfoCodeToRegistrationKeyMapping: Record<
      string,
      keyof RegistrationViewEntity
    > = {
      [fspFieldCode]: 'programFspConfigurationName',
    };

    const code = field.code as string;

    if (code in activityInfoCodeToRegistrationKeyMapping) {
      return activityInfoCodeToRegistrationKeyMapping[code];
    }

    return code;
  }
}
