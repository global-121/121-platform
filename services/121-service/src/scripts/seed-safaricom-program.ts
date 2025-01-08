import { Injectable } from '@nestjs/common';

import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplate from '@121-service/src/seed-data/message-template/message-template-safaricom-program.json';
import organizationGeneric from '@121-service/src/seed-data/organization/organization-generic.json';
import program from '@121-service/src/seed-data/program/program-safaricom.json';

@Injectable()
export class SeedSafaricomProgram implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const programEntity = await this.seedHelper.addProgram(program, isApiTests);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplate, programEntity);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntity);

    // ***** CREATE ORGANIZATION *****
    // Technically multiple organizations could be loaded, but that should not be done
    await this.seedHelper.addOrganization(organizationGeneric);
  }
}
