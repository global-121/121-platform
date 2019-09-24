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

@Injectable()
export class SeedMvp implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Country A' }]);
    await countryRepository.save([{ country: 'Country B' }]);

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

    this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** ASSIGN AIDWORKER TO PROGRAM *****

    await this.seedHelper.assignAidworker(2, 1);
    await this.seedHelper.assignAidworker(2, 2);
    await this.seedHelper.assignAidworker(2, 3);

    // ***** CREATE AVAILABILITY FOR AN AIDWORKER *****
    const availabilityRepository = this.connection.getRepository(
      AvailabilityEntity,
    );

    let newAvailability;
    for (var item of [0, 1]) {
      let availability = new AvailabilityEntity();
      let exampleDate = new Date();
      exampleDate.setDate(exampleDate.getDate() + item);
      exampleDate.setHours(12 + item, 0);

      availability.startDate = exampleDate;
      availability.endDate = exampleDate;
      availability.endDate.setHours(17 + item);

      availability.location = 'Location ' + item;

      let aidworker = await userRepository.findOne(2);
      availability.aidworker = aidworker;

      newAvailability = await availabilityRepository.save(availability);
    }
  }
}

export default SeedMvp;
