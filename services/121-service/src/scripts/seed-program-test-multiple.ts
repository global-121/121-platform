import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplateDemo from '@121-service/src/seed-data/message-template/message-template-demo.json';
import messageTemplateTest from '@121-service/src/seed-data/message-template/message-template-test.json';
import messageTemplateValidation from '@121-service/src/seed-data/message-template/message-template-validation.json';
import organizationDemo from '@121-service/src/seed-data/organization/organization-demo.json';
import programDemo from '@121-service/src/seed-data/program/program-demo.json';
import programTest from '@121-service/src/seed-data/program/program-test.json';
import programValidation from '@121-service/src/seed-data/program/program-validation.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedTestMultipleProgram implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ************************
    // ***** Program Demo *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityDemo = await this.seedHelper.addProgram(
      programDemo,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateDemo,
      programEntityDemo,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityDemo);

    // ***** CREATE ORGANIZATION *****
    // Technically multiple organizations could be loaded, but that should not be done
    await this.seedHelper.addOrganization(organizationDemo);

    // ************************
    // ***** Program Test *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityTest = await this.seedHelper.addProgram(
      programTest,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateTest,
      programEntityTest,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityTest);

    // ******************************
    // ***** Program Validation *****
    // ******************************

    // ***** CREATE PROGRAM *****
    const programEntityValidation = await this.seedHelper.addProgram(
      programValidation,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateValidation,
      programEntityValidation,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityValidation);
  }
}
