import { Injectable } from '@nestjs/common';
import intanceLbn from '../../seed-data/instance/instance-pilot-lbn.json';
import messageTemplatePilotLbn from '../../seed-data/message-template/message-template-pilot-lbn.json';
import programPilotLbn from '../../seed-data/program/program-pilot-lbn.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';

@Injectable()
export class SeedProgramLbn implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(
      programPilotLbn,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotLbn, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(intanceLbn);
  }
}

export default SeedProgramLbn;
