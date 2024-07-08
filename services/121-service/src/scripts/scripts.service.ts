import { SeedMockHelper } from '@121-service/src/scripts/seed-mock-helpers';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScriptsService {
  public constructor(private readonly seedMockHelper: SeedMockHelper) {}

  public async duplicateData(powerNrRegistrationsString: string) {
    const { powerNrRegistrations } =
      await this.seedMockHelper.validateParametersForDataDuplication({
        powerNrRegistrationsString,
      });

    await this.seedMockHelper.multiplyRegistrations(powerNrRegistrations);
    await this.seedMockHelper.updateSequenceNumbers();
  }
}
