import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserRole } from '../user-role.enum';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspIntersolveNoWhatsapp from '../../seed-data/fsp/fsp-intersolve-no-whatsapp.json';

import programValidation from '../../seed-data/program/program-validation.json';
import instanceAnonymous from '../../seed-data/instance/instance-anonymous.json';

@Injectable()
export class SeedProgramValidation implements InterfaceScript {
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

    const fieldValidationUser = await this.seedHelper.addUser({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_FIELD_VALIDATION,
      password:
        process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FIELD_VALIDATION,
    });

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspIntersolveNoWhatsapp);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programValidation);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.assignAidworker(fullAccessUser.id, program.id, [
      UserRole.PersonalData,
      UserRole.RunProgram,
    ]);
    await this.seedHelper.assignAidworker(runProgramUser.id, program.id, [
      UserRole.RunProgram,
    ]);
    await this.seedHelper.assignAidworker(personalDataUser.id, program.id, [
      UserRole.PersonalData,
    ]);
    await this.seedHelper.assignAidworker(viewOnlyUser.id, program.id, [
      UserRole.View,
    ]);
    await this.seedHelper.assignAidworker(fieldValidationUser.id, program.id, [
      UserRole.FieldValidation,
    ]);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceAnonymous);
  }
}

export default SeedProgramValidation;
