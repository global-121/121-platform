import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceLVV from '../../seed-data/instance/instance-pilot-nl.json';
import messageTemplateLVV from '../../seed-data/message-template/message-template-nlrc-lvv.json';
import programLVV from '../../seed-data/program/program-nlrc-lvv.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedNLProgramLVV implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(isApiTests?: boolean): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run(isApiTests);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programLVV);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplateLVV, program);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(program, false);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceLVV);
  }
}

export default SeedNLProgramLVV;
