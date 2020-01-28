import { UserRole } from './../user-roles.enum';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { USERCONFIG } from '../secrets';
import crypto from 'crypto';


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
        role: UserRole.Admin,
        email: USERCONFIG.emailAdmin,
        countryId: USERCONFIG.countryId,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordAdmin)
          .digest('hex'),
        status: 'active',
      },
    ]);

    await userRepository.save([
      {
        username: USERCONFIG.usernameAidWorker,
        role: UserRole.Aidworker,
        email: USERCONFIG.emailAidWorker,
        countryId: USERCONFIG.countryId,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordAidWorker)
          .digest('hex'),
        status: 'active',
      },
    ]);

    await userRepository.save([
      {
        username: USERCONFIG.usernameProgramManager,
        role: UserRole.ProgramManager,
        email: USERCONFIG.emailProgramManager,
        countryId: USERCONFIG.countryId,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordProgramManager)
          .digest('hex'),
        status: 'active',
      },
    ]);

    await userRepository.save([
      {
        username: USERCONFIG.usernamePrivacyOfficer,
        role: UserRole.PrivacyOfficer,
        email: USERCONFIG.emailPrivacyOfficer,
        countryId: USERCONFIG.countryId,
        password: crypto
          .createHmac('sha256', USERCONFIG.passwordPrivacyOfficer)
          .digest('hex'),
        status: 'active',
      },
    ]);
  }
}

export default SeedInit;
