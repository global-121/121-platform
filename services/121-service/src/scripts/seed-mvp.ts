import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedPublish } from './seed-publish';
import { SeedInit } from './seed-init';

import { CountryEntity } from '../programs/country/country.entity';

import fspBank from '../../examples/fsp-bank.json';
import fspMobileMoney from '../../examples/fsp-mobile-money.json';
import fspMixedAttributes from '../../examples/fsp-mixed-attributes.json';
import fspNoAttributes from '../../examples/fsp-no-attributes.json';

import { ProtectionServiceProviderEntity } from '../programs/program/protection-service-provider.entity';

import programAnonymousExample1 from '../../examples/program-anonymous1.json';
import programAnonymousExample2 from '../../examples/program-anonymous2.json';
import { USERCONFIG } from '../secrets';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedMvp implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);
  private readonly seedPublish = new SeedPublish();

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    await this.seedHelper.addUser({
      username: USERCONFIG.usernameAidWorker,
      role: UserRole.Aidworker,
      email: USERCONFIG.emailAidWorker,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordAidWorker,
    });

    await this.seedHelper.addUser({
      username: USERCONFIG.usernameProgramManager,
      role: UserRole.ProgramManager,
      email: USERCONFIG.emailProgramManager,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordProgramManager,
    });

    await this.seedHelper.addUser({
      username: USERCONFIG.usernamePrivacyOfficer,
      role: UserRole.PrivacyOfficer,
      email: USERCONFIG.emailPrivacyOfficer,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordPrivacyOfficer,
    });

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Location A' }]);
    await countryRepository.save([{ country: 'Location B' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
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

    // ***** CREATE AVAILABILITY FOR AN AIDWORKER *****
    await this.seedHelper.availabilityForAidworker(
      {
        startDate: '2020-10-10T12:00:00Z',
        endDate: '2020-10-10T13:00:00Z',
        location: 'Address of location 1',
      },
      2,
    );
    await this.seedHelper.availabilityForAidworker(
      {
        startDate: '2020-10-11T18:00:00Z',
        endDate: '2020-10-12T12:00:00Z',
        location: 'Address of location 2',
      },
      2,
    );
    await this.seedHelper.availabilityForAidworker(
      {
        startDate: '2020-10-20T00:00:00Z',
        endDate: '2020-10-20T23:59:59Z',
        location: 'Address of location 3',
      },
      2,
    );

    await this.seedPublish.run();
  }
}

export default SeedMvp;
