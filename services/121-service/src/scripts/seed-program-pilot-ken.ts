import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import { CountryEntity } from '../programs/country/country.entity';
import fspMpesa from '../../seed-data/fsp/fsp-mpesa.json';
import programPilotKen from '../../seed-data/program/program-pilot-ken.json';
import instancePilotKen from '../../seed-data/instance/instance-pilot-ken.json';
import { USERCONFIG } from '../secrets';
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
      role: UserRole.ProjectOfficer,
      email: USERCONFIG.emailProjectOfficer,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordProjectOfficer,
    });

    await this.seedHelper.addUser({
      role: UserRole.ProgramManager,
      email: USERCONFIG.emailProgramManager,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordProgramManager,
    });

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Kenya' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspMpesa);

    // ***** CREATE PROGRAM *****
    const examplePrograms = [programPilotKen];
    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotKen);
  }
}

export default SeedPilotKenProgram;
