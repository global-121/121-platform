import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import { CountryEntity } from '../programs/country/country.entity';
import fspBank from '../../examples/fsp-bank.json';
import fspMobileMoney from '../../examples/fsp-mobile-money.json';
import programPilotKen from '../../examples/program-pilot-ken.json';
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
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMobileMoney);

    // ***** CREATE PROGRAM *****
    const examplePrograms = [programPilotKen];
    await this.seedHelper.addPrograms(examplePrograms, 1);
  }
}

export default SeedPilotKenProgram;
