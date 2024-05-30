import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import instanceNLRC from '@121-service/src/seed-data/instance/instance-nlrc.json';
import messageTemplatePV from '@121-service/src/seed-data/message-template/message-template-nlrc-pv.json';
import programPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedNLProgramPV implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPV, isApiTests);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplatePV, program);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceNLRC);
  }
}
