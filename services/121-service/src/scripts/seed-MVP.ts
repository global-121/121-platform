import { SeedInit } from './seed-init';
import { CredentialAttributesEntity } from '../sovrin/credential/credential-attributes.entity';
import { AppointmentEntity } from '../schedule/appointment/appointment.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';
import { USERCONFIG } from '../secrets';
import { UserEntity } from '../user/user.entity';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript, ScriptsModule } from './scripts.module';
import * as crypto from 'crypto';
import programBasicExample from '../../examples/program-basic.json';
import programFullExample from '../../examples/program-full.json';
import programMvpExample from '../../examples/program-anonymous.json';
import { AvailabilityEntity } from '../schedule/appointment/availability.entity';
import { CountryEntity } from '../programs/country/country.entity';

@Injectable()
export class SeedMVP implements InterfaceScript {
  public constructor(private connection: Connection) { }

  public async run(): Promise<void> {

    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();


    // ***** CREATE COUNTRIES *****

    const countryRepository = this.connection.getRepository(
      CountryEntity,
    );
    await countryRepository.save([{ country: 'Country A' }]);
    await countryRepository.save([{ country: 'Country B' }]);

    // ***** CREATE A CONNECTION *****

    const connectionRepository = this.connection.getRepository(
      ConnectionEntity,
    );
    await connectionRepository.save([
      {
        did: 'did:sov:1wJPyULfLLnYTEFYzByfUR',
        programsEnrolled: [1],
        programsIncluded: [1],
        programsExcluded: [],
      },
    ]);

    // ***** CREATE A PROGRAM WITH CUSTOM CRITERIA *****

    const customCriteriumRepository = this.connection.getRepository(
      CustomCriterium,
    );
    const programRepository = this.connection.getRepository(ProgramEntity);

    const userRepository = this.connection.getRepository(UserEntity);
    const author = await userRepository.findOne(1);
    for (let programExample of [programMvpExample, programFullExample, programBasicExample]) {
      const programExampleDump = JSON.stringify(programExample);
      const program = JSON.parse(programExampleDump);

      program.author = author;

      // Remove original custom criteria and add it to a sepperate variable
      const customCriteria = program.customCriteria;
      program.customCriteria = [];

      for (let customCriterium of customCriteria) {
        let customReturn = await customCriteriumRepository.save(customCriterium);
        program.customCriteria.push(customReturn);
      }

      await programRepository.save(program);
    }

    // ***** ASSIGN AIDWORKER TO PROGRAM *****
    const program_d = await programRepository.findOne(1); // Assign programId=1 ...
    const user_d = await userRepository.findOne(2); // ... to userId=2 (aidworker)
    user_d.assignedProgram = program_d;
    await userRepository.save(user_d);


    // ***** CREATE AVAILABILITY FOR AN AIDWORKER *****
    const availabilityRepository = this.connection.getRepository(
      AvailabilityEntity,
    );

    let newAvailability;
    for (var item of [0, 1]) {
      let availability = new AvailabilityEntity();
      availability.startDate = new Date();
      availability.startDate.setDate(availability.startDate.getDate() + item);
      availability.endDate = new Date();
      availability.endDate.setDate(availability.endDate.getDate() + item + 1);
      availability.location = 'London';
      let aidworker = await userRepository.findOne(2);
      availability.aidworker = aidworker;
      newAvailability = await availabilityRepository.save(availability);
    }




    // ***** CREATE APPOINTMENT *****
    const appointmentRepository = this.connection.getRepository(
      AppointmentEntity,
    );

    const appointment = new AppointmentEntity();
    appointment.timeslotId = newAvailability.id;
    appointment.did = 'did:sov:1wJPyULfLLnYTEFYzByfUR';
    await appointmentRepository.save(appointment);

    // ***** CREATE PREFILLED ANSWERS *****
    const credentialAttributesRepository = this.connection.getRepository(
      CredentialAttributesEntity,
    );
    let credential1 = new CredentialAttributesEntity();
    credential1.did = 'did:sov:1wJPyULfLLnYTEFYzByfUR';
    credential1.programId = 1;
    credential1.attributeId = 1;
    credential1.attribute = 'nr_of_children';
    credential1.answer = 2;
    await credentialAttributesRepository.save(credential1);
    let credential2 = new CredentialAttributesEntity();
    credential2.did = 'did:sov:1wJPyULfLLnYTEFYzByfUR';
    credential2.programId = 1;
    credential2.attributeId = 2;
    credential2.attribute = 'roof_type';
    credential2.answer = 0;
    await credentialAttributesRepository.save(credential2);

    await this.connection.close();
  }
}

export default SeedMVP;
