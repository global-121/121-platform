import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
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
        this.getFspConfigurationErrorMessage(programId, name),
      ),
    );
    const errorMessages = validationResults.filter(
      (result): result is string => result !== undefined,
    );
    if (errorMessages.length > 0) {
      throw new HttpException(errorMessages.join(', '), HttpStatus.BAD_REQUEST);
    }
  }

  private async getFspConfigurationErrorMessage(
    programId: number,
    programFspConfigurationName: string,
  ): Promise<string | undefined> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
        programId: Equal(programId),
      },
    });

    if (!config) {
      return `Missing Program FSP configuration with name ${programFspConfigurationName}`;
    }

    if (config.state !== FspConfigurationStates.configured) {
      return `Program FSP configuration ${programFspConfigurationName} is not fully configured`;
    }

    return;
  }
}
