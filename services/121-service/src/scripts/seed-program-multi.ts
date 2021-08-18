import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspBank from '../../seed-data/fsp/fsp-bank.json';
import fspMobileMoney from '../../seed-data/fsp/fsp-mobile-money.json';
import fspMixedAttributes from '../../seed-data/fsp/fsp-mixed-attributes.json';
import fspNoAttributes from '../../seed-data/fsp/fsp-no-attributes.json';
import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspAfricasTalking from '../../seed-data/fsp/fsp-africas-talking.json';

import programAnonymousExample1 from '../../seed-data/program/program-anonymous1.json';
import programAnonymousExample2 from '../../seed-data/program/program-anonymous2.json';
import instanceAnonymous from '../../seed-data/instance/instance-anonymous.json';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedMultiProgram implements InterfaceScript {
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
    await this.seedHelper.addFsp(fspAfricasTalking);
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMobileMoney);
    await this.seedHelper.addFsp(fspMixedAttributes);
    await this.seedHelper.addFsp(fspNoAttributes);

    // ***** CREATE A INSTANCES OF THE SAME EXAMPLE PROGRAM WITH DIFFERENT TITLES FOR DIFFERENT COUNTRIES*****
    const programAnonymousExample3 = { ...programAnonymousExample1 };
    const programAnonymousExample4 = { ...programAnonymousExample2 };

    const program1 = await this.seedHelper.addProgram(programAnonymousExample1);
    const program2 = await this.seedHelper.addProgram(programAnonymousExample2);
    const program3 = await this.seedHelper.addProgram(programAnonymousExample3);
    const program4 = await this.seedHelper.addProgram(programAnonymousExample4);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    const programs = [program1, program2, program3, program4];
    for (let program of programs) {
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
      await this.seedHelper.assignAidworker(
        fieldValidationUser.id,
        program.id,
        [UserRole.FieldValidation],
      );
    }

    // ***** CREATE INSTANCE *****
    // NOTE: the multi-NGO setting of this seed-script does not comply with this single-NGO instance. We choose 'NGO A' here.
    await this.seedHelper.addInstance(instanceAnonymous);
  }
}

export default SeedMultiProgram;
