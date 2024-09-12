import { Injectable } from '@nestjs/common';

import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplateTest from '@121-service/src/seed-data/message-template/message-template-test.json';
import organizationAdmin from '@121-service/src/seed-data/organization/organization-one-admin.json';
import programTest from '@121-service/src/seed-data/program/program-test-one-admin.json';

@Injectable()
export class SeedTestOneAdmin implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programTest, isApiTests);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplateTest, program);

    await this.seedHelper.addOneDefaultAdminUser(program);

    // ***** CREATE ORGANIZATION *****
    await this.seedHelper.addOrganization(organizationAdmin);
  }
}
