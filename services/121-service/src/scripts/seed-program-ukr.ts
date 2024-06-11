import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplatePilotUkr from '@121-service/src/seed-data/message-template/message-template-pilot-ukr.json';
import organizationUkr from '@121-service/src/seed-data/organization/organization-pilot-ukr.json';
import programPilotUkr from '@121-service/src/seed-data/program/program-pilot-ukr.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedProgramUkr implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(
      programPilotUkr,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotUkr, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE ORGANIZATION *****
    await this.seedHelper.addOrganization(organizationUkr);
  }
}
