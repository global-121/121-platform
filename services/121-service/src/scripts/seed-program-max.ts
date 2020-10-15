import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspAllAttributes from '../../seed-data/fsp/fsp-all-attributes.json';
import fspNoAttributes from '../../seed-data/fsp/fsp-no-attributes.json';

import { ProtectionServiceProviderEntity } from '../programs/program/protection-service-provider.entity';

import programMax from '../../seed-data/program/program-max.json';
import instanceMax from '../../seed-data/instance/instance-max.json';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedProgramMax implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE USERS *****
    await this.seedHelper.addUser({
      role: UserRole.Aidworker,
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_AID_WORKER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_AID_WORKER,
    });

    await this.seedHelper.addUser({
      role: UserRole.ProjectOfficer,
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_PROJECT_OFFICER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROJECT_OFFICER,
    });

    await this.seedHelper.addUser({
      role: UserRole.ProgramManager,
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_MANAGER,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_PROGRAM_MANAGER,
    });

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspAllAttributes);
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

    const examplePrograms = [programMax];
    await this.seedHelper.addPrograms(examplePrograms, 1);

    // ***** ASSIGN AIDWORKER TO PROGRAM *****
    await this.seedHelper.assignAidworker(2, 1);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceMax);
  }
}

export default SeedProgramMax;
