import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceEthJointResponse from '../../seed-data/instance/instance-eth-joint-response.json';
import programPilotEth from '../../seed-data/program/program-eth-joint-response.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedProgramDorcasEth implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run();

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programPilotEth);

    this.seedHelper.addDefaultUsers(program, true);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceEthJointResponse);
  }
}

export default SeedProgramDorcasEth;
