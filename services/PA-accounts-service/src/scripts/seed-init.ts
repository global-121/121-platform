import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { USERCONFIG } from '../secrets';
import crypto from 'crypto';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    await this.connection.dropDatabase();
    await this.connection.synchronize(true);

    // ***** CREATE ADMIN USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save([
      {
        username: USERCONFIG.username,
        password: crypto
          .createHmac('sha256', USERCONFIG.password)
          .digest('hex'),
      },
    ]);
  }
}

export default SeedInit;
