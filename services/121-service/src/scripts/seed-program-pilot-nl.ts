import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import { CountryEntity } from '../programs/country/country.entity';

import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';

import programPilotNL from '../../seed-data/program/program-pilot-nl.json';
import instancePilotNL from '../../seed-data/instance/instance-pilot-nl.json';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedPilotNLProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE USERS *****
    await this.seedHelper.addUser({
      role: UserRole.ProjectOfficer,
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_PROJECT_OFFICER,
      countryId: process.env.USERCONFIG_121_SERVICE_COUNTRY_ID,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROJECT_OFFICER
    });

    await this.seedHelper.addUser({
      role: UserRole.ProgramManager,
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_MANAGER,
      countryId: process.env.USERCONFIG_121_SERVICE_COUNTRY_ID,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_MANAGER
    });

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Nederland' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);

    // ***** CREATE PROGRAM *****
    const examplePrograms = [programPilotNL];
    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotNL);
  }
}

export default SeedPilotNLProgram;
