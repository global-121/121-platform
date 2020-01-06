import { SeedPublish } from './seed-publish';
import SeedInit from './seed-init';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { CountryEntity } from '../programs/country/country.entity';
import { UserEntity } from '../user/user.entity';

import programAnonymousExample1 from '../../examples/program-anonymous1.json';
import programAnonymousExample2 from '../../examples/program-anonymous2.json';
import { SeedHelper } from './seed-helper';
import { AvailabilityEntity } from '../schedule/appointment/availability.entity';
import { FinancialServiceProviderEntity } from '../programs/program/financial-service-provider.entity';
import { ProtectionServiceProviderEntity } from '../programs/program/protection-service-provider.entity';

@Injectable()
export class SeedMvp implements InterfaceScript {
  public constructor(private connection: Connection) { }

  private readonly seedHelper = new SeedHelper(this.connection);
  private readonly seedPublish = new SeedPublish();

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Location A' }]);
    await countryRepository.save([{ country: 'Location B' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    const financialServiceProviderRepository = this.connection.getRepository(FinancialServiceProviderEntity);
    await financialServiceProviderRepository.save([{ fsp: 'Bank A' }]);
    await financialServiceProviderRepository.save([{ fsp: 'Mobile Money Provider B' }]);

    // ***** CREATE PROTECTION SERVICE PROVIDERS *****
    const protectionServiceProviderRepository = this.connection.getRepository(ProtectionServiceProviderEntity);
    await protectionServiceProviderRepository.save([{ psp: 'Protection Service Provider A' }]);
    await protectionServiceProviderRepository.save([{ psp: 'Protection Service Provider B' }]);

    // ***** CREATE A INSTANCES OF THE SAME EXAMPLE PROGRAM WITH DIFFERENT TITLES FOR DIFFERENT COUNTRIES*****

    const userRepository = this.connection.getRepository(UserEntity);

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
    const availabilityRepository = this.connection.getRepository(
      AvailabilityEntity,
    );

    let newAvailability;
    const items = [
      {
        startDate: 30,
        endDate: 30,
        startTime: 12,
        location: 'A'
      },
      {
        startDate: 31,
        endDate: 32,
        startTime: 13,
        location: 'B'
      }
    ]
    for (var item of items) {
      let availability = new AvailabilityEntity();
      let startDate = new Date();
      let endDate = new Date();
      startDate.setDate(startDate.getDate() + item.startDate);
      endDate.setDate(endDate.getDate() + item.endDate);
      startDate.setHours(item.startTime, 0);
      endDate.setHours(item.startTime + 5, 0);

      availability.startDate = startDate;
      availability.endDate = endDate;

      availability.location = 'Location ' + item.location;

      let aidworker = await userRepository.findOne(2);
      availability.aidworker = aidworker;

      newAvailability = await availabilityRepository.save(availability);
    }

    await this.seedPublish.run();
  }
}

export default SeedMvp;
