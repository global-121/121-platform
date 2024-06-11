import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplateValidation from '@121-service/src/seed-data/message-template/message-template-validation.json';
import organizationAnonymous from '@121-service/src/seed-data/organization/organization-anonymous.json';
import programValidation from '@121-service/src/seed-data/program/program-validation.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedProgramValidation implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(
      programValidation,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateValidation,
      program,
    );

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE ORGANIZATION *****
    await this.seedHelper.addOrganization(organizationAnonymous);
  }
}
