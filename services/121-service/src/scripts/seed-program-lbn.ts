import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplatePilotLbn from '@121-service/src/seed-data/message-template/message-template-pilot-lbn.json';
import organizationLbn from '@121-service/src/seed-data/organization/organization-pilot-lbn.json';
import programPilotLbn from '@121-service/src/seed-data/program/program-pilot-lbn.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedProgramLbn implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(
      programPilotLbn,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotLbn, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE ORGANIZATION *****
    await this.seedHelper.addOrganization(organizationLbn);
  }
}
