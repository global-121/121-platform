import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspIntersolveNoWhatsapp from '../../seed-data/fsp/fsp-intersolve-no-whatsapp.json';

import programPilotNL from '../../seed-data/program/program-pilot-nl.json';
import instancePilotNL from '../../seed-data/instance/instance-pilot-nl.json';
import { DefaultUserRole } from '../user/user-role.enum';

@Injectable()
export class SeedPilotNLProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspIntersolveNoWhatsapp);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotNL);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(program, false);
    await this.seedHelper.assignAdminUserToProgram(program.id);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotNL);
  }
}

export default SeedPilotNLProgram;
