import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedPublish } from './seed-publish';
import { SeedInit } from './seed-init';

import { CountryEntity } from '../programs/country/country.entity';

import fspBank from '../../seed-data/fsp/fsp-bank.json';
import fspMobileMoney from '../../seed-data/fsp/fsp-mobile-money.json';
import fspMixedAttributes from '../../seed-data/fsp/fsp-mixed-attributes.json';
import fspNoAttributes from '../../seed-data/fsp/fsp-no-attributes.json';
import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspMpesa from '../../seed-data/fsp/fsp-mpesa.json';

import { ProtectionServiceProviderEntity } from '../programs/program/protection-service-provider.entity';

import programAnonymousExample1 from '../../seed-data/program/program-anonymous1.json';
import programAnonymousExample2 from '../../seed-data/program/program-anonymous2.json';
import instanceAnonymous from '../../seed-data/instance/instance-anonymous.json';
import { USERCONFIG } from '../secrets';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedMultiProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);
  private readonly seedPublish = new SeedPublish();

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE USERS *****
    await this.seedHelper.addUser({
      role: UserRole.Aidworker,
      email: USERCONFIG.emailAidWorker,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordAidWorker,
    });

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
    await countryRepository.save([{ country: 'Location A' }]);
    await countryRepository.save([{ country: 'Location B' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspMpesa);
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMobileMoney);
    await this.seedHelper.addFsp(fspMixedAttributes);
    await this.seedHelper.addFsp(fspNoAttributes);

    // ***** CREATE PROTECTION SERVICE PROVIDERS *****
    const protectionServiceProviderRepository = this.connection.getRepository(
      ProtectionServiceProviderEntity,
    );
    await protectionServiceProviderRepository.save([
      { psp: 'Protection Service Provider A' },
    ]);
    await protectionServiceProviderRepository.save([
      { psp: 'Protection Service Provider B' },
    ]);

    // ***** CREATE A INSTANCES OF THE SAME EXAMPLE PROGRAM WITH DIFFERENT TITLES FOR DIFFERENT COUNTRIES*****
    const programAnonymousExample3 = { ...programAnonymousExample1 };
    programAnonymousExample3.countryId = 2;
    const programAnonymousExample4 = { ...programAnonymousExample2 };
    programAnonymousExample4.countryId = 2;

    const examplePrograms = [
      programAnonymousExample1,
      programAnonymousExample2,
      programAnonymousExample3,
      programAnonymousExample4,
    ];
    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** ASSIGN AIDWORKER TO PROGRAM *****
    await this.seedHelper.assignAidworker(2, 1);
    await this.seedHelper.assignAidworker(2, 2);
    await this.seedHelper.assignAidworker(2, 3);
    await this.seedHelper.assignAidworker(2, 4);

    // ***** CREATE INSTANCE *****
    // NOTE: the multi-NGO setting of this seed-script does not comply with this single-NGO instance. We choose 'NGO A' here.
    await this.seedHelper.addInstance(instanceAnonymous);
  }
}

export default SeedMultiProgram;
