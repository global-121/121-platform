import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplateTest from '@121-service/src/seed-data/message-template/message-template-test.json';
import organizationDemo from '@121-service/src/seed-data/organization/organization-demo.json';
import programTest from '@121-service/src/seed-data/program/program-test.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedTestProgram implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programTest, isApiTests);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplateTest, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE ORGANIZATION *****
    await this.seedHelper.addOrganization(organizationDemo);
  }
}
