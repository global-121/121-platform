import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceDrc from '../../seed-data/instance/instance-drc.json';
import programDrc from '../../seed-data/program/program-drc.json';
import messageTemplateDrc from '../../seed-data/message-template/message-template-drc.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedProgramDrc implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(isApiTests?: boolean): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run(isApiTests);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programDrc);

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplateDrc, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDrc);
  }
}

export default SeedProgramDrc;
