import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspBank from '../../seed-data/fsp/fsp-bank.json';
import fspMobileMoney from '../../seed-data/fsp/fsp-mobile-money.json';
import fspMixedAttributes from '../../seed-data/fsp/fsp-mixed-attributes.json';
import fspNoAttributes from '../../seed-data/fsp/fsp-no-attributes.json';
import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspAfricasTalking from '../../seed-data/fsp/fsp-africas-talking.json';

import { ProtectionServiceProviderEntity } from '../programs/program/protection-service-provider.entity';

import programAnonymousExample1 from '../../seed-data/program/program-anonymous1.json';
import programAnonymousExample2 from '../../seed-data/program/program-anonymous2.json';
import instanceAnonymous from '../../seed-data/instance/instance-anonymous.json';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedMultiProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE USERS *****
    await this.seedHelper.addUser({
      roles: [UserRole.PersonalData, UserRole.RunProgram],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_FULL_ACCESS,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FULL_ACCESS,
    });

    await this.seedHelper.addUser({
      roles: [UserRole.RunProgram],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_RUN_PROGRAM,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_RUN_PROGRAM,
    });

    await this.seedHelper.addUser({
      roles: [UserRole.PersonalData],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_PERSONAL_DATA,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_PERSONAL_DATA,
    });

    await this.seedHelper.addUser({
      roles: [UserRole.View],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
    });

    const fieldValidationUser = await this.seedHelper.addUser({
      roles: [UserRole.FieldValidation],
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_FIELD_VALIDATION,
      password:
        process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_FIELD_VALIDATION,
    });

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspAfricasTalking);
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMobileMoney);
    await this.seedHelper.addFsp(fspMixedAttributes);
    await this.seedHelper.addFsp(fspNoAttributes);

    // ***** CREATE PROTECTION SERVICE PROVIDERS *****
    const protectionServiceProviderRepository = this.connection.getRepository(
      ProtectionServiceProviderEntity,
    );
    await protectionServiceProviderRepository.save([
      { psp: 'Protection Service Provider A' },
    ]);
    await protectionServiceProviderRepository.save([
      { psp: 'Protection Service Provider B' },
    ]);

    // ***** CREATE A INSTANCES OF THE SAME EXAMPLE PROGRAM WITH DIFFERENT TITLES FOR DIFFERENT COUNTRIES*****
    const programAnonymousExample3 = { ...programAnonymousExample1 };
    const programAnonymousExample4 = { ...programAnonymousExample2 };

    const examplePrograms = [
      programAnonymousExample1,
      programAnonymousExample2,
      programAnonymousExample3,
      programAnonymousExample4,
    ];
    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** ASSIGN AIDWORKER TO PROGRAM *****
    await this.seedHelper.assignAidworker(fieldValidationUser.id, 1);
    await this.seedHelper.assignAidworker(fieldValidationUser.id, 2);
    await this.seedHelper.assignAidworker(fieldValidationUser.id, 3);
    await this.seedHelper.assignAidworker(fieldValidationUser.id, 4);

    // ***** CREATE INSTANCE *****
    // NOTE: the multi-NGO setting of this seed-script does not comply with this single-NGO instance. We choose 'NGO A' here.
    await this.seedHelper.addInstance(instanceAnonymous);
  }
}

export default SeedMultiProgram;
