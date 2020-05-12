import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript } from './scripts.module';

import { SeedPublish } from './seed-publish';

import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';
import { AppointmentEntity } from '../schedule/appointment/appointment.entity';
import { CredentialAttributesEntity } from '../sovrin/credential/credential-attributes.entity';

const EXAMPLE_DID = 'did:sov:1wJPyULfLLnYTEFYzByfUR';

@Injectable()
export class SeedDev implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    // *****  ADD DATA YOU WANT TO SEED*****

    await this.connection.close();
  }
}

export default SeedDev;
