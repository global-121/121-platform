import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspVodaCash from '../../seed-data/fsp/fsp-vodacash.json';

import programDrc from '../../seed-data/program/program-drc.json';
import instanceDrc from '../../seed-data/instance/instance-drc.json';

@Injectable()
export class SeedProgramDrc implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspVodaCash);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programDrc);

    this.seedHelper.addDefaultUsers(program, true);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDrc);
  }
}

export default SeedProgramDrc;
