import { UserRole } from '../user-role.enum';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import crypto from 'crypto';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    await this.connection.dropDatabase();
    await this.connection.synchronize(true);

    // ***** CREATE ADMIN AND AIDWORKER USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save([
      {
        role: UserRole.Admin,
        email: process.env.121_SERVICE_USERCONFIG_emailAdmin,
        countryId: process.env.121_SERVICE_USERCONFIG_countryId,
        password: crypto
          .createHmac('sha256', process.env.121_SERVICE_USERCONFIG_passwordAdmin)
          .digest('hex'),
        status: 'active',
      },
    ]);
  }
}

export default SeedInit;
