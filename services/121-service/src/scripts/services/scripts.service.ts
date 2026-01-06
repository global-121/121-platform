import { Injectable } from '@nestjs/common';

import { IS_PRODUCTION } from '@121-service/src/config';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { SEED_CONFIGURATION_SETTINGS } from '@121-service/src/scripts/seed-configuration.const';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { SeedHelperService } from '@121-service/src/scripts/services/seed-helper.service';
import { SeedMockHelperService } from '@121-service/src/scripts/services/seed-mock-helper.service';

@Injectable()
export class ScriptsService {
  public constructor(
    private readonly seedMockHelper: SeedMockHelperService,
    private readonly seedHelper: SeedHelperService,
    private readonly seedInit: SeedInit,
    private readonly seedMultipleNlrcMockData: SeedMultipleNLRCMockData,
  ) {}

  public async loadSeedScenario({
    seedScript,
    isApiTests,
    powerNrRegistrationsString,
    includeRegistrationEvents = false,
    nrPaymentsString,
    powerNrMessagesString,
    mockPv = true,
    mockOcw = true,
    resetIdentifier,
    approverMode = ApproverSeedMode.admin,
  }: {
    seedScript: string;
    isApiTests: boolean;
    powerNrRegistrationsString?: string;
    includeRegistrationEvents?: boolean;
    nrPaymentsString?: string;
    powerNrMessagesString?: string;
    mockPv?: boolean;
    mockOcw?: boolean;
    resetIdentifier?: string;
    approverMode?: ApproverSeedMode;
  }) {
    console.log(
      `DB reset - Seed: ${seedScript} - Identifier: ${resetIdentifier}`,
    );
    const seedConfig = this.getSeedConfigByNameOrThrow(seedScript);

    await this.seedInit.run({
      isApiTests,
    });
    if (seedConfig.seedAdminOnly) {
      return;
    }

    if (seedConfig.includeMockData) {
      await this.seedMultipleNlrcMockData.run({
        isApiTests,
        powerNrRegistrationsString,
        nrPaymentsString,
        powerNrMessagesString,
        includeRegistrationEvents,
        mockPv,
        mockOcw,
        seedConfig,
        approverMode,
      });
      return;
    }

    await this.seedHelper.seedData({ seedConfig, isApiTests, approverMode });
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

  public async duplicateData({
    powerNrRegistrationsString,
    nrPaymentsString = '0',
    includeRegistrationEvents = false,
  }: {
    powerNrRegistrationsString: string;
    nrPaymentsString?: string;
    includeRegistrationEvents?: boolean;
  }) {
    const { powerNrRegistrations, nrPayments } =
      await this.seedMockHelper.validateParametersForDataDuplication({
        powerNrRegistrationsString,
        nrPaymentsString,
      });

    await this.seedMockHelper.multiplyRegistrations({
      powerNr: powerNrRegistrations,
      includeRegistrationEvents,
    });
    await this.seedMockHelper.alignOtherDataWithRegistrations({
      powerNr: powerNrRegistrations,
    });
    await this.seedMockHelper.addExtraPaymentsAndAlignRelatedData({
      nrPayments,
    }); // Ensure payment related data is extended
    await this.seedMockHelper.updateDerivedData();
    await this.seedMockHelper.updateSequenceNumbers();
    await this.seedMockHelper.introduceDuplicates();
  }
}
