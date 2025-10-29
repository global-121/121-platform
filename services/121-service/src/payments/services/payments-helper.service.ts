import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { getFspConfigurationRequiredProperties } from '@121-service/src/fsps/fsp-settings.helpers';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class PaymentsHelperService {
  public constructor(
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async checkFspConfigurationsOrThrow(
    programId: number,
    programFspConfigurationNames: string[],
  ): Promise<void> {
    const validationResults = await Promise.all(
      programFspConfigurationNames.map((name) =>
        this.validateMissingFspConfigurations(programId, name),
      ),
    );
    const errorMessages = validationResults.flat();
    if (errorMessages.length > 0) {
      throw new HttpException(
        `${errorMessages.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateMissingFspConfigurations(
    programId: number,
    programFspConfigurationName: string,
  ): Promise<string[]> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
        programId: Equal(programId),
      },
      relations: ['properties'],
    });

    const errorMessages: string[] = [];
    if (!config) {
      errorMessages.push(
        `Missing Program FSP configuration with name ${programFspConfigurationName}`,
      );
      return errorMessages;
    }

    const requiredConfigurations = getFspConfigurationRequiredProperties(
      config.fspName,
    );
    // Early return for FSP that don't have required configurations
    if (!requiredConfigurations) {
      return [];
    }

    for (const requiredConfiguration of requiredConfigurations) {
      const foundConfig = config.properties.find(
        (c) => c.name === requiredConfiguration,
      );
      if (!foundConfig) {
        errorMessages.push(
          `Missing required configuration ${requiredConfiguration} for FSP ${config.fspName}`,
        );
      }
    }

    return errorMessages;
  }
}
