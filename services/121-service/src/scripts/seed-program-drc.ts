import { Injectable } from '@nestjs/common';
import instanceDrc from '../../seed-data/instance/instance-drc.json';
import messageTemplateDrc from '../../seed-data/message-template/message-template-drc.json';
import programDrc from '../../seed-data/program/program-drc.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';

@Injectable()
export class SeedProgramDrc implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programDrc, isApiTests);

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplateDrc, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDrc);
  }
}

export default SeedProgramDrc;
