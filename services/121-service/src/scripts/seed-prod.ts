import SeedInit from './seed-init';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { CountryEntity } from '../programs/country/country.entity';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserEntity } from '../user/user.entity';

import programAnonymousExample from '../../examples/program-anonymous.json';
import { SeedHelper } from './seed-helper';
import { AppointmentEntity } from '../schedule/appointment/appointment.entity';
import { AvailabilityEntity } from '../schedule/appointment/availability.entity';

@Injectable()
export class SeedProd implements InterfaceScript {
  public constructor(private connection: Connection, private readonly seedHelper: SeedHelper) {}

  // private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Country A' }]);
    await countryRepository.save([{ country: 'Country B' }]);

    // ***** CREATE A INSTANCES OF THE SAME EXAMPLE PROGRAM WITH DIFFERENT TITLES FOR DIFFERENT COUNTRIES*****
    const customCriteriumRepository = this.connection.getRepository(
      CustomCriterium,
    );
    const programRepository = this.connection.getRepository(ProgramEntity);

    const userRepository = this.connection.getRepository(UserEntity);
    const author = await userRepository.findOne(1);

    const programAnonymousExample1 = { ...programAnonymousExample };
    const programAnonymousExample2 = { ...programAnonymousExample };
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

    for (let programExample of examplePrograms) {
      const programExampleDump = JSON.stringify(programExample);
      const program = JSON.parse(programExampleDump);
      program.author = author;

      // Remove original custom criteria and add it to a sepperate variable
      const customCriteria = program.customCriteria;
      program.customCriteria = [];

      for (let customCriterium of customCriteria) {
        let customReturn = await customCriteriumRepository.save(
          customCriterium,
        );
        program.customCriteria.push(customReturn);
      }

      await programRepository.save(program);
    }

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

export default SeedProd;
