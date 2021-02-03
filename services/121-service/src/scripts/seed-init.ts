import { UserRole } from '../user-role.enum';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import crypto from 'crypto';
import { UserRoleEntity } from '../user/user-role.entity';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    await this.connection.dropDatabase();
    await this.connection.synchronize(true);

    const userRoleRepository = this.connection.getRepository(UserRoleEntity);
    await userRoleRepository.save([
      {
        role: UserRole.Admin,
      },
      {
        role: UserRole.ProgramManager,
      },
      {
        role: UserRole.ProjectOfficer,
      },
      {
        role: UserRole.Aidworker,
      },
    ]);

    // ***** CREATE ADMIN USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save({
      role: UserRole.Admin,
      roles: await userRoleRepository.find({
        where: { role: UserRole.Admin },
      }),
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: crypto
        .createHmac('sha256', process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN)
        .digest('hex'),
      status: 'active',
    });
  }
}

export default SeedInit;
