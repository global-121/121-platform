import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CreateExcelFspConfigurationDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/create-excel-fsp-configuration.dto';
import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { UpdateExcelFspConfigurationDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/update-excel-fsp-configuration.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';

@Injectable()
export class ExcelFspConfigurationService {
  public constructor(
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly programFspConfigurationsService: ProgramFspConfigurationsService,
  ) {}

  public async getConfiguration({
    programId,
    configurationName,
  }: {
    programId: number;
    configurationName: string;
  }): Promise<ExcelFspConfigurationResponseDto> {
    const configuration =
      await this.programFspConfigurationRepository.getExcelConfigurationByProgramIdAndName({
        programId,
        configurationName,
      });
    if (!configuration) {
      throw new HttpException(
        `Excel FSP-configuration with name ${configurationName} not found for program ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const uniqueIdentifierField = configuration.properties.find(
      (property) => property.name === FspConfigurationProperties.columnToMatch,
    )?.value;
    const exportFields = configuration.properties.find(
      (property) => property.name === FspConfigurationProperties.columnsToExport,
    )?.value;

    return {
      uniqueIdentifierField:
        typeof uniqueIdentifierField === 'string' ? uniqueIdentifierField : '',
      exportFields: Array.isArray(exportFields) ? exportFields : [],
    };
  }

  public async createConfiguration({
    programId,
    configuration,
  }: {
    programId: number;
    configuration: CreateExcelFspConfigurationDto;
  }): Promise<ProgramFspConfigurationResponseDto> {
    return this.programFspConfigurationsService.create(programId, {
      name: configuration.name,
      label: configuration.label,
      fspName: Fsps.excel,
      properties: this.getConfigurationProperties({ configuration }),
    });
  }

  public async updateConfiguration({
    programId,
    configurationName,
    configuration,
  }: {
    programId: number;
    configurationName: string;
    configuration: UpdateExcelFspConfigurationDto;
  }): Promise<ProgramFspConfigurationResponseDto> {
    await this.getConfiguration({ programId, configurationName });
    return this.programFspConfigurationsService.update(programId, configurationName, {
      label: configuration.label,
      properties: this.getConfigurationProperties({ configuration }),
    });
  }

  private getConfigurationProperties({
    configuration,
  }: {
    configuration: UpdateExcelFspConfigurationDto;
  }) {
    return [
      {
        name: FspConfigurationProperties.columnToMatch,
        value: configuration.uniqueIdentifierField,
      },
      {
        name: FspConfigurationProperties.columnsToExport,
        value: configuration.exportFields ?? [],
      },
    ];
  }
}
