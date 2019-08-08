import { CredentialEntity } from './../sovrin/credential/credential.entity';
import { AppointmentEntity } from './../schedule/appointment/appointment.entity';
import { ProgramEntity } from './../programs/program/program.entity';
import { CustomCriterium } from './../programs/program/custom-criterium.entity';
import { ConnectionEntity } from './../sovrin/create-connection/connection.entity';
import { USERCONFIG } from './../secrets';
import { UserEntity } from './../user/user.entity';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript } from './scripts.module';
import * as crypto from 'crypto';
import programExample from '../../examples/program-post.json';
import { AvailabilityEntity } from '../schedule/appointment/availability.entity';

@Injectable()
export class Seed implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    await this.connection.dropDatabase();
    await this.connection.synchronize(true);

    // ***** CREATE ADMIN AND FIELDWORKER USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save([
      {
        username: USERCONFIG.usernameAdmin,
        role: 'admin',
        email: USERCONFIG.emailAdmin,
        countryId: 1,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordAdmin)
          .digest('hex'),
        status: 'active',
      },
    ]);

    await userRepository.save([
      {
        username: USERCONFIG.usernameFieldworker,
        role: 'fieldworker',
        email: USERCONFIG.emailFieldworker,
        countryId: 1,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordFieldworker)
          .digest('hex'),
        status: 'active',
      },
    ]);

    // ***** CREATE A CONNECTION *****

    const connectrionRepository = this.connection.getRepository(
      ConnectionEntity,
    );
    await connectrionRepository.save([
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

    const programExampleDump = JSON.stringify(programExample);
    const program = JSON.parse(programExampleDump);

    const author = await userRepository.findOne(1);
    program.author = author;

    // Remove original custom criteria and add it to a sepperate variable
    const customCriteria = program.customCriteria;
    program.customCriteria = [];

    for (let customCriterium of customCriteria) {
      console.log(customCriterium);
      let customReturn = await customCriteriumRepository.save(customCriterium);
      program.customCriteria.push(customReturn);
    }

    await programRepository.save(program);

    // ***** CREATE AVAILABILITY FOR AN AIDWORKER *****
    const availabilityRepository = this.connection.getRepository(
      AvailabilityEntity,
    );

    const availability = new AvailabilityEntity();
    availability.startDate = new Date();
    availability.endDate = new Date();
    availability.endDate.setDate(availability.endDate.getDate() + 1);
    availability.location = 'London';
    const aidworker = await userRepository.findOne(2);
    availability.aidworker = aidworker;
    const newAvailability = await availabilityRepository.save(availability);

    // ***** CREATE APPOINTMENT *****
    const appointmentRepository = this.connection.getRepository(
      AppointmentEntity,
    );

    const appointment = new AppointmentEntity();
    appointment.timeslotId = newAvailability.id;
    appointment.did = 'did:sov:1wJPyULfLLnYTEFYzByfUR';
    await appointmentRepository.save(appointment);

    // ***** CREATE PREFILLED ANSWERS *****
    const credentialRepository = this.connection.getRepository(
      CredentialEntity,
    );
    let credential1 = new CredentialEntity();
    credential1.did = 'did:sov:1wJPyULfLLnYTEFYzByfUR';
    credential1.programId = 1;
    credential1.attributeId = 1;
    credential1.attribute = 'nr_of_children';
    credential1.answer = 2;
    await credentialRepository.save(credential1);
    let credential2 = new CredentialEntity();
    credential2.did = 'did:sov:1wJPyULfLLnYTEFYzByfUR';
    credential2.programId = 1;
    credential2.attributeId = 2;
    credential2.attribute = 'roof_type';
    credential2.answer = 0;
    await credentialRepository.save(credential2);

    await this.connection.close();
  }
}

export default Seed;
