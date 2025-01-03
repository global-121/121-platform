import { Injectable } from '@nestjs/common';

import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplateAne from '@121-service/src/seed-data/message-template/message-template-joint-response-ANE.json';
import messageTemplateDorcas from '@121-service/src/seed-data/message-template/message-template-joint-response-dorcas.json';
import messageTemplateEKHCDC from '@121-service/src/seed-data/message-template/message-template-joint-response-EKHCDC.json';
import organizationEthJointResponse from '@121-service/src/seed-data/organization/organization-eth-joint-response.json';
import programAne from '@121-service/src/seed-data/program/program-joint-response-ANE.json';
import programDorcas from '@121-service/src/seed-data/program/program-joint-response-dorcas.json';
import programEKHCDC from '@121-service/src/seed-data/program/program-joint-response-EKHCDC.json';

@Injectable()
export class SeedEthJointResponse implements InterfaceScript {
  public constructor(private seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
    // ************************
    // ***** Program Ane *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityAne = await this.seedHelper.addProgram(
      programAne,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateAne,
      programEntityAne,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityAne);

    // ***** CREATE ORGANIZATION *****
    // Technically multiple organizations could be loaded, but that should not be done
    await this.seedHelper.addOrganization(organizationEthJointResponse);

    // ************************
    // ***** Program Dorcas *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityDorcas = await this.seedHelper.addProgram(
      programDorcas,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateDorcas,
      programEntityDorcas,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityDorcas);

    // ************************
    // ***** Program EKHCDC *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityEKHCDC = await this.seedHelper.addProgram(
      programEKHCDC,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateEKHCDC,
      programEntityEKHCDC,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityEKHCDC);
  }
}
