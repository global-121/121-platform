import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instancePilotNL from '../../seed-data/instance/instance-pilot-nl.json';
import programPilotNL from '../../seed-data/program/program-pilot-nl.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedPilotNLProgram implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(isApiTests?: boolean): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run(isApiTests);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotNL);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(program, false);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotNL);
  }
}

export default SeedPilotNLProgram;
