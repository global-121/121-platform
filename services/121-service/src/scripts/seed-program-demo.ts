import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplateDemo from '@121-service/src/seed-data/message-template/message-template-demo.json';
import organizationDemo from '@121-service/src/seed-data/organization/organization-demo.json';
import programDemo from '@121-service/src/seed-data/program/program-demo.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedDemoProgram implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programDemo, isApiTests);

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplateDemo, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE ORGANISATION *****
    await this.seedHelper.addOrganization(organizationDemo);
  }
}
