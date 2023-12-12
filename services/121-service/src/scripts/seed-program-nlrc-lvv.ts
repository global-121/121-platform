import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceNLRC from '../../seed-data/instance/instance-nlrc.json';
import messageTemplateLVV from '../../seed-data/message-template/message-template-nlrc-lvv.json';
import programLVV from '../../seed-data/program/program-nlrc-lvv.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';
import { MessageTemplateService } from '../notifications/message-template/message-template.service';

@Injectable()
export class SeedNLProgramLVV implements InterfaceScript {
  public constructor(
    private dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  private readonly seedHelper = new SeedHelper(
    this.dataSource,
    this.messageTemplateService,
  );

  public async run(isApiTests?: boolean): Promise<void> {
    const seedInit = new SeedInit(this.dataSource, this.messageTemplateService);
    await seedInit.run(isApiTests);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programLVV);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplateLVV, program);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceNLRC);
  }
}

export default SeedNLProgramLVV;
