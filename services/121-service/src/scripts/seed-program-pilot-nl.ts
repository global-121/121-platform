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
      email: process.env.121_SERVICE_USERCONFIG_emailProjectOfficer,
      countryId: process.env.121_SERVICE_USERCONFIG_countryId,
      password: process.env.121_SERVICE_USERCONFIG_passwordProjectOfficer,
    });

    await this.seedHelper.addUser({
      role: UserRole.ProgramManager,
      email: process.env.121_SERVICE_USERCONFIG_emailProgramManager,
      countryId: process.env.121_SERVICE_USERCONFIG_countryId,
      password: process.env.121_SERVICE_USERCONFIG_passwordProgramManager,
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
