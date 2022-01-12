import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { DefaultUserRole } from '../user/user-role.enum';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspBob from '../../seed-data/fsp/fsp-bob.json';

import programPilotLbn from '../../seed-data/program/program-pilot-lbn.json';
import intanceLbn from '../../seed-data/instance/instance-pilot-lbn.json';

@Injectable()
export class SeedProgramLbn implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspBob);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotLbn);

    this.seedHelper.addDefaultUsers(program, true);
    await this.seedHelper.assignAdminUserToProgram(program.id);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(intanceLbn);
  }
}

export default SeedProgramLbn;
