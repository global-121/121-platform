import { Injectable } from '@nestjs/common';

import { SEED_CONFIGURATION_SETTINGS } from '@121-service/src/scripts/seed-configuration.const';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMockHelper } from '@121-service/src/scripts/seed-mock-helpers';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';

@Injectable()
export class ScriptsService {
  public constructor(
    private readonly seedMockHelper: SeedMockHelper,
    private readonly seedHelper: SeedHelper,
    private readonly seedInit: SeedInit,
    private readonly seedMultipleNlrcMockData: SeedMultipleNLRCMockData,
  ) {}

  public async loadSeedScenario({
    seedScript,
    isApiTests,
    powerNrRegistrationsString,
    nrPaymentsString,
    powerNrMessagesString,
    mockPv = true,
    mockOcw = true,
    resetIdentifier,
  }: {
    seedScript: string;
    isApiTests: boolean;
    powerNrRegistrationsString?: string;
    nrPaymentsString?: string;
    powerNrMessagesString?: string;
    mockPv?: boolean;
    mockOcw?: boolean;
    resetIdentifier?: string;
  }) {
    console.log(
      `DB reset - Seed: ${seedScript} - Identifier: ${resetIdentifier}`,
    );
    const seedConfig = this.getSeedConfigByNameOrThrow(seedScript);

    await this.seedInit.run(isApiTests);
    if (seedConfig.seedAdminOnly) {
      return;
    }

    if (seedConfig.includeMockData) {
      // For now equate boolean includeMockData to NLRC mock. Use separate script and return early.
      await this.seedMultipleNlrcMockData.run(
        isApiTests,
        powerNrRegistrationsString,
        nrPaymentsString,
        powerNrMessagesString,
        mockPv,
        mockOcw,
        seedConfig,
      );
      return;
    }

    await this.seedHelper.seedData(seedConfig, isApiTests);
  }

  private getSeedConfigByNameOrThrow(seedScript: string): SeedConfigurationDto {
    const seedConfig = SEED_CONFIGURATION_SETTINGS.find(
      (scenario) => scenario.name === seedScript,
    );
    if (!seedConfig) {
      throw new Error(`No seedConfig found with name ${seedScript}`);
    }
    if (
      seedConfig.includeMockData &&
      !['development', 'test'].includes(process.env.NODE_ENV!)
    ) {
      throw new Error(
        `Mock data is only allowed in development and test environments`,
      );
    }
    return seedConfig;
  }

  public async duplicateData(powerNrRegistrationsString: string) {
    const { powerNrRegistrations } =
      await this.seedMockHelper.validateParametersForDataDuplication({
        powerNrRegistrationsString,
      });

    await this.seedMockHelper.multiplyRegistrations(powerNrRegistrations);
    await this.seedMockHelper.updateSequenceNumbers();
    await this.seedMockHelper.introduceDuplicates();
  }
}
