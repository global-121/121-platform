import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { USERCONFIG } from '../secrets';
import { CountryEntity } from '../programs/country/country.entity';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import * as crypto from 'crypto';
import { SchemaEntity } from '../sovrin/schema/schema.entity';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private connection: Connection) { }

  public async run(): Promise<void> {
    await this.connection.dropDatabase();
    await this.connection.synchronize(true);


    // ***** CREATE ADMIN AND AIDWORKER USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save([
      {
        username: USERCONFIG.usernameAdmin,
        role: 'admin',
        email: USERCONFIG.emailAdmin,
        countryId: USERCONFIG.countryIdAdmin,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordAdmin)
          .digest('hex'),
        status: 'active',
      },
    ]);

    await userRepository.save([
      {
        username: USERCONFIG.usernameAidWorker,
        role: 'aidworker',
        email: USERCONFIG.emailAidWorker,
        countryId: USERCONFIG.countryIdAidWorker,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordAidWorker)
          .digest('hex'),
        status: 'active',
      },
    ]);
  }
}

export default SeedInit;
