import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspAfricasTalking from '../../seed-data/fsp/fsp-africas-talking.json';
import programPilotKen from '../../seed-data/program/program-pilot-ken.json';
import instancePilotKen from '../../seed-data/instance/instance-pilot-ken.json';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedPilotKenProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE USERS *****
    await this.seedHelper.addUser({
      roles: [UserRole.RunProgram],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_PROJECT_OFFICER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROJECT_OFFICER,
    });

    await this.seedHelper.addUser({
      roles: [UserRole.PersonalData],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_MANAGER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_MANAGER,
    });

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspAfricasTalking);

    // ***** CREATE PROGRAM *****
    const examplePrograms = [programPilotKen];
    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotKen);
  }
}

export default SeedPilotKenProgram;
