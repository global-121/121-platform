import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { UpdateExcelFspConfigurationDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/update-excel-fsp-configuration.dto';
import { ExcelFspConfigurationRepository } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.repository';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { PaymentsProgressService } from '@121-service/src/payments/services/payments-progress.service';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';

@Injectable()
export class ExcelFspConfigurationService {
  public constructor(
    private readonly excelFspConfigurationRepository: ExcelFspConfigurationRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
    private readonly paymentsProgressService: PaymentsProgressService,
  ) {}

  public async getConfiguration({
    programId,
    configurationName,
  }: {
    programId: number;
    configurationName: string;
  }): Promise<ExcelFspConfigurationResponseDto> {
    const programFspConfiguration =
      await this.programFspConfigurationRepository.getByProgramIdAndName({
        programId,
        name: configurationName,
      });
    if (programFspConfiguration?.fspName !== Fsps.excel) {
      throw this.configurationNotFound({ programId, configurationName });
    }

    const excelConfiguration =
      await this.excelFspConfigurationRepository.getByProgramFspConfigurationId(
        {
          programFspConfigurationId: programFspConfiguration.id,
        },
      );

    return {
      name: programFspConfiguration.name,
      label: programFspConfiguration.label,
      uniqueIdentifierField: excelConfiguration?.uniqueIdentifierField ?? '',
      exportFields: excelConfiguration?.exportFields ?? [],
    };
  }

  public async saveConfiguration({
    programId,
    configurationName,
    configuration,
  }: {
    programId: number;
    configurationName: string;
    configuration: UpdateExcelFspConfigurationDto;
  }): Promise<ExcelFspConfigurationResponseDto> {
    await this.paymentsProgressService.checkPaymentInProgressAndThrow(
      programId,
    );

    const programFspConfiguration =
      await this.programFspConfigurationRepository.getByProgramIdAndName({
        programId,
        name: configurationName,
      });
    if (programFspConfiguration?.fspName !== Fsps.excel) {
      throw this.configurationNotFound({ programId, configurationName });
    }

    const programAttributeNames = new Set(
      await this.programRegistrationAttributeRepository.getNamesByProgramId({
        programId,
      }),
    );
    const exportFields =
      configuration.exportFields ?? [...programAttributeNames];
    const requestedFields = [
      configuration.uniqueIdentifierField,
      ...exportFields,
    ];
    const invalidFields = requestedFields.filter(
      (field) => !programAttributeNames.has(field),
    );
    if (invalidFields.length > 0) {
      throw new HttpException(
        `Excel configuration fields must be registration attributes in the program: ${[
          ...new Set(invalidFields),
        ].join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const savedConfiguration =
      await this.excelFspConfigurationRepository.saveConfiguration({
        programFspConfigurationId: programFspConfiguration.id,
        uniqueIdentifierField: configuration.uniqueIdentifierField,
        exportFields,
      });
    await this.programFspConfigurationRepository.updateState({
      programId,
      name: configurationName,
      state: FspConfigurationStates.configured,
    });

    return {
      name: programFspConfiguration.name,
      label: programFspConfiguration.label,
      uniqueIdentifierField: savedConfiguration.uniqueIdentifierField,
      exportFields: savedConfiguration.exportFields,
    };
  }

  private configurationNotFound({
    programId,
    configurationName,
  }: {
    programId: number;
    configurationName: string;
  }): HttpException {
    return new HttpException(
      `Excel FSP-configuration with name ${configurationName} not found for program ${programId}`,
      HttpStatus.NOT_FOUND,
    );
  }
}
