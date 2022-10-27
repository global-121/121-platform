import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import fspUkrPoshta from '../../seed-data/fsp/fsp-ukrposhta.json';
import instanceUkr from '../../seed-data/instance/instance-pilot-ukr.json';
import programPilotUkr from '../../seed-data/program/program-pilot-ukr.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedProgramUkr implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspUkrPoshta);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotUkr);

    this.seedHelper.addDefaultUsers(program, true);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceUkr);
  }
}

export default SeedProgramUkr;
