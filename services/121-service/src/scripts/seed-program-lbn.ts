import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import intanceLbn from '../../seed-data/instance/instance-pilot-lbn.json';
import programPilotLbn from '../../seed-data/program/program-pilot-lbn.json';
import messageTemplatePilotLbn from '../../seed-data/message-template/message-template-pilot-lbn.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';
import { MessageTemplateService } from '../notifications/message-template/message-template.service';

@Injectable()
export class SeedProgramLbn implements InterfaceScript {
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
    const program = await this.seedHelper.addProgram(programPilotLbn);

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotLbn, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(intanceLbn);
  }
}

export default SeedProgramLbn;
