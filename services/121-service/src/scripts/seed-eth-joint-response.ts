import { Injectable } from '@nestjs/common';
import instanceEthJointResponse from '../../seed-data/instance/instance-eth-joint-response.json';
import messageTemplateAne from '../../seed-data/message-template/message-template-joint-response-ANE.json';
import messageTemplateEKHCDC from '../../seed-data/message-template/message-template-joint-response-EKHCDC.json';
import messageTemplateDorcas from '../../seed-data/message-template/message-template-joint-response-dorcas.json';
import programAne from '../../seed-data/program/program-joint-response-ANE.json';
import programEKHCDC from '../../seed-data/program/program-joint-response-EKHCDC.json';
import programDorcas from '../../seed-data/program/program-joint-response-dorcas.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';

@Injectable()
export class SeedEthJointResponse implements InterfaceScript {
  public constructor(private seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
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

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceEthJointResponse);

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
