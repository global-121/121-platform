import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedPublish } from './seed-publish';
import { SeedInit } from './seed-init';

import { CountryEntity } from '../programs/country/country.entity';

import fspBank from '../../seed-data/fsp/fsp-bravos.json';
import fspMixedAttributes from '../../seed-data/fsp/fsp-mixed-attributes.json';
import fspNoAttributes from '../../seed-data/fsp/fsp-no-attributes.json';
import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspMpesa from '../../seed-data/fsp/fsp-mpesa.json';

import programDemo from '../../seed-data/program/program-demo.json';
import instanceDemo from '../../seed-data/instance/instance-demo.json';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedDemoProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);
  private readonly seedPublish = new SeedPublish();

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
    await countryRepository.save([{ country: 'Westeros' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspMpesa);
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMixedAttributes);
    await this.seedHelper.addFsp(fspNoAttributes);

    // ***** CREATE PROGRAM *****
    const examplePrograms = [programDemo];
    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDemo);
  }
}

export default SeedDemoProgram;
