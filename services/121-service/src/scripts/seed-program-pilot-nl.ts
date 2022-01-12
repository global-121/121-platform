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

    // ***** CREATE USERS *****
    const fullAccessUser = await this.seedHelper.addUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_FULL_ACCESS,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });

    const runProgramUser = await this.seedHelper.addUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_RUN_PROGRAM,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_RUN_PROGRAM,
    });

    const personalDataUser = await this.seedHelper.addUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_PERSONAL_DATA,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_PERSONAL_DATA,
    });

    const viewOnlyUser = await this.seedHelper.addUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
    });

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspIntersolveNoWhatsapp);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotNL);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.assignAidworker(fullAccessUser.id, program.id, [
      DefaultUserRole.PersonalData,
      DefaultUserRole.RunProgram,
    ]);
    await this.seedHelper.assignAidworker(runProgramUser.id, program.id, [
      DefaultUserRole.RunProgram,
    ]);
    await this.seedHelper.assignAidworker(personalDataUser.id, program.id, [
      DefaultUserRole.PersonalData,
    ]);
    await this.seedHelper.assignAidworker(viewOnlyUser.id, program.id, [
      DefaultUserRole.View,
    ]);

    await this.seedHelper.assignAdminUserToProgram(program.id);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotNL);
  }
}

export default SeedPilotNLProgram;
