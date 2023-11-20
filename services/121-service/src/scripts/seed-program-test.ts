import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceDemo from '../../seed-data/instance/instance-demo.json';
import programTest from '../../seed-data/program/program-test.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedTestProgram implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(isApiTests?: boolean): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run(isApiTests);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programTest);

    await this.seedHelper.addDefaultUsers(program, true);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDemo);
  }
}

export default SeedTestProgram;
