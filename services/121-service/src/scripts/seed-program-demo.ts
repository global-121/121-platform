import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceDemo from '../../seed-data/instance/instance-demo.json';
import programDemo from '../../seed-data/program/program-demo.json';
import messageTemplateDemo from '../../seed-data/message-template/message-template-demo.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';
import { MessageTemplateService } from '../notifications/message-template/message-template.service';

@Injectable()
export class SeedDemoProgram implements InterfaceScript {
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
    const program = await this.seedHelper.addProgram(programDemo);

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplateDemo, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDemo);
  }
}

export default SeedDemoProgram;
