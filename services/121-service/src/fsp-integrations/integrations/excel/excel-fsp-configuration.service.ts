import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { ExcelFspConfigurationResponseDto } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-configuration-response.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class ExcelFspConfigurationService {
  public constructor(
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async getConfiguration(
    programId: number,
    configurationName: string,
  ): Promise<ExcelFspConfigurationResponseDto> {
    const configurations = await this.programFspConfigurationRepository.find({
      where: {
        programId: Equal(programId),
        name: Equal(configurationName),
        fspName: Equal(Fsps.excel),
      },
      relations: { properties: true },
    });

    const configuration = configurations[0];
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
}
