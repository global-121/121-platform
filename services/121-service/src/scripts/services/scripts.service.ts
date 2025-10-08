import { Injectable } from '@nestjs/common';

import { IS_PRODUCTION } from '@121-service/src/config';
import { SEED_CONFIGURATION_SETTINGS } from '@121-service/src/scripts/seed-configuration.const';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { SeedHelperService } from '@121-service/src/scripts/services/seed-helper.service';
import { SeedMockHelperServiceTyped } from '@121-service/src/scripts/services/seed-mock-helper-typed.service';

@Injectable()
export class ScriptsService {
  public constructor(
    private readonly seedMockHelper: SeedMockHelperServiceTyped,
    private readonly seedHelper: SeedHelperService,
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
      `[${new Date().toISOString()}] SEED INFO: DB reset initiated - Script: ${seedScript}, Identifier: ${resetIdentifier}`,
    );
    const seedConfig = this.getSeedConfigByNameOrThrow(seedScript);

    await this.seedInit.run(isApiTests);
    if (seedConfig.seedAdminOnly) {
      return;
    }

    if (seedConfig.includeMockData) {
      // Use the type-safe factory approach (now integrated into the main class)
      console.log(`[${new Date().toISOString()}] SEED INFO: Using type-safe factory approach for mock data generation`);
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
    if (seedConfig.includeMockData && IS_PRODUCTION) {
      throw new Error(`Mock data is NOT allowed in production environments`);
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
