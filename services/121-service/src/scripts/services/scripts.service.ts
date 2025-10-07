import { Injectable } from '@nestjs/common';

import { IS_PRODUCTION } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { SEED_CONFIGURATION_SETTINGS } from '@121-service/src/scripts/seed-configuration.const';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { SeedMultipleNLRCMockDataTyped } from '@121-service/src/scripts/seed-multiple-nlrc-mock-typed';
import { SeedHelperService } from '@121-service/src/scripts/services/seed-helper.service';
import { SeedMockHelperService } from '@121-service/src/scripts/services/seed-mock-helper.service';

@Injectable()
export class ScriptsService {
  public constructor(
    private readonly seedMockHelper: SeedMockHelperService,
    private readonly seedHelper: SeedHelperService,
    private readonly seedInit: SeedInit,
    private readonly seedMultipleNlrcMockData: SeedMultipleNLRCMockData,
    private readonly seedMultipleNlrcMockDataTyped: SeedMultipleNLRCMockDataTyped,
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
      // Check if we should use the new type-safe factories
      const useTypedFactories = process.env.USE_TYPED_SEEDING === 'true';
      
      if (useTypedFactories) {
        console.log('**USING NEW TYPE-SAFE FACTORY APPROACH**');
        // Use the new type-safe factory approach
        await this.seedMultipleNlrcMockDataTyped.run(
          isApiTests,
          powerNrRegistrationsString,
          nrPaymentsString,
          powerNrMessagesString,
          mockPv,
          mockOcw,
          seedConfig,
        );
      } else {
        console.log('**USING LEGACY RAW SQL APPROACH**');
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
      }
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
