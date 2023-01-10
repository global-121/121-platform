import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import fspVodaCash from '../../seed-data/fsp/fsp-vodacash.json';
import instanceDrc from '../../seed-data/instance/instance-drc.json';
import programDrc from '../../seed-data/program/program-drc.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedProgramDrc implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
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
