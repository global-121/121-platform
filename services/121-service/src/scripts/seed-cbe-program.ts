import { Injectable } from '@nestjs/common';

import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplate from '@121-service/src/seed-data/message-template/message-template-cbe-program.json';
import organizationGeneric from '@121-service/src/seed-data/organization/organization-generic.json';
import program from '@121-service/src/seed-data/program/program-cbe.json';

@Injectable()
export class SeedCbeProgram implements InterfaceScript {
  public constructor(private seedHelper: SeedHelper) {}

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
