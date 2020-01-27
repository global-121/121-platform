import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript } from './scripts.module';

import { AppointmentEntity } from '../schedule/appointment/appointment.entity';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';
import { CredentialAttributesEntity } from '../sovrin/credential/credential-attributes.entity';
import SeedPublish from './seed-publish';

const EXAMPLE_DID = 'did:sov:1wJPyULfLLnYTEFYzByfUR';

@Injectable()
export class SeedDev implements InterfaceScript {
  public constructor(private connection: Connection) { }

  private readonly seedPublish = new SeedPublish();

  public async run(): Promise<void> {

    // ***** CREATE A CONNECTION *****
    const connectionRepository = this.connection.getRepository(
      ConnectionEntity,
    );
    await connectionRepository.save([
      {
        did: EXAMPLE_DID,
        phoneNumber: '0031600000000',
        programsEnrolled: [1],
        programsIncluded: [1],
        programsExcluded: [],
      },
    ]);

    // ***** CREATE APPOINTMENT *****
    const appointmentRepository = this.connection.getRepository(
      AppointmentEntity,
    );

    const appointment = new AppointmentEntity();
    appointment.timeslotId = 1;
    appointment.did = EXAMPLE_DID;
    appointment.status = 'waiting'
    await appointmentRepository.save(appointment);

    // ***** CREATE PREFILLED ANSWERS *****
    const credentialAttributesRepository = this.connection.getRepository(
      CredentialAttributesEntity,
    );

    let credential1 = new CredentialAttributesEntity();
    credential1.did = EXAMPLE_DID;
    credential1.programId = 1;
    credential1.attributeId = 1;
    credential1.attribute = 'nr_of_children';
    credential1.answer = '2';
    await credentialAttributesRepository.save(credential1);

    let credential2 = new CredentialAttributesEntity();
    credential2.did = EXAMPLE_DID;
    credential2.programId = 1;
    credential2.attributeId = 2;
    credential2.attribute = 'roof_type';
    credential2.answer = '0';
    await credentialAttributesRepository.save(credential2);

    await this.seedPublish.run();
    await this.connection.close();
  }
}

export default SeedDev;
