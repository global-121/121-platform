import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { DefaultUserRole } from '../user/user-role.enum';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspBelcash from '../../seed-data/fsp/fsp-belcash.json';

import programPilotEth from '../../seed-data/program/program-pilot-eth.json';
import instancePilotEth from '../../seed-data/instance/instance-pilot-eth.json';

@Injectable()
export class SeedProgramEth implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspBelcash);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotEth);

    this.seedHelper.addDefaultUsers(program, true);
    await this.seedHelper.assignAdminUserToProgram(program.id);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotEth);
  }
}

export default SeedProgramEth;
