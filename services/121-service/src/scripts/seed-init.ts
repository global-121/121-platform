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
        label: 'Admin',
      },
      {
        role: UserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
      },
      {
        role: UserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
      },
      {
        role: UserRole.RunProgram,
        label: 'Run Program',
      },
      {
        role: UserRole.FieldValidation,
        label: 'Do Field Validation',
      },
    ]);

    // ***** CREATE ADMIN USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save({
      // roles: await userRoleRepository.find({
      //   where: { role: UserRole.Admin },
      // }),
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: crypto
        .createHmac('sha256', process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN)
        .digest('hex'),
    });
  }
}

export default SeedInit;
