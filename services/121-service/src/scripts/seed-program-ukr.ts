import { Injectable } from '@nestjs/common';
import instanceUkr from '../../seed-data/instance/instance-pilot-ukr.json';
import messageTemplatePilotUkr from '../../seed-data/message-template/message-template-pilot-ukr.json';
import programPilotUkr from '../../seed-data/program/program-pilot-ukr.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';

@Injectable()
export class SeedProgramUkr implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(
      programPilotUkr,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotUkr, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceUkr);
  }
}

export default SeedProgramUkr;
