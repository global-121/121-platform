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
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_RUN_PROGRAM,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_RUN_PROGRAM,
    });

    await this.seedHelper.addUser({
      roles: [UserRole.PersonalData],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_PERSONAL_DATA,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_PERSONAL_DATA,
    });

    await this.seedHelper.addUser({
      roles: [UserRole.PersonalData, UserRole.RunProgram],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_FULL_ACCESS,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });

    await this.seedHelper.addUser({
      roles: [UserRole.View],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
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
