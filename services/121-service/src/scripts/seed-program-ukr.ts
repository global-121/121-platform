import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceUkr from '../../seed-data/instance/instance-pilot-ukr.json';
import messageTemplatePilotUkr from '../../seed-data/message-template/message-template-pilot-ukr.json';
import programPilotUkr from '../../seed-data/program/program-pilot-ukr.json';
import { MessageTemplateService } from '../notifications/message-template/message-template.service';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedProgramUkr implements InterfaceScript {
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
    const program = await this.seedHelper.addProgram(
      programPilotUkr,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplatePilotUkr, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceUkr);
  }
}

export default SeedProgramUkr;
