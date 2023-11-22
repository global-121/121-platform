import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instancePilotNL from '../../seed-data/instance/instance-pilot-nl.json';
import programPilotNL2 from '../../seed-data/program/program-pilot-nl-2.json';
import messageTemplatePilotNL2 from '../../seed-data/message-template/message-template-pilot-nl-2.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedPilotNL2Program implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(isApiTests?: boolean): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run(isApiTests);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotNL2);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotNL2, program);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(program, false);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotNL);
  }
}

export default SeedPilotNL2Program;
