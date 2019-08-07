import { USERCONFIG } from './../secrets';
import { UserEntity } from './../user/user.entity';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript } from './scripts.module';
import * as crypto from 'crypto';

@Injectable()
export class Seed implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    await this.connection.dropDatabase();
    await this.connection.synchronize(true);
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
    await this.connection.close();


  }
}

export default Seed;
