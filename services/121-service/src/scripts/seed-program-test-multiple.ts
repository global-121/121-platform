import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceDemo from '../../seed-data/instance/instance-demo.json';
import messageTemplateDemo from '../../seed-data/message-template/message-template-demo.json';
import messageTemplateTest from '../../seed-data/message-template/message-template-test.json';
import messageTemplateValidation from '../../seed-data/message-template/message-template-validation.json';
import programDemo from '../../seed-data/program/program-demo.json';
import programTest from '../../seed-data/program/program-test.json';
import programValidation from '../../seed-data/program/program-validation.json';
import { MessageTemplateService } from '../notifications/message-template/message-template.service';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedTestMultipleProgram implements InterfaceScript {
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

    // ************************
    // ***** Program Demo *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityDemo = await this.seedHelper.addProgram(
      programDemo,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateDemo,
      programEntityDemo,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityDemo);

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceDemo);

    // ************************
    // ***** Program Test *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityTest = await this.seedHelper.addProgram(
      programTest,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateTest,
      programEntityTest,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityTest);

    // ******************************
    // ***** Program Validation *****
    // ******************************

    // ***** CREATE PROGRAM *****
    const programEntityValidation = await this.seedHelper.addProgram(
      programValidation,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateValidation,
      programEntityValidation,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityValidation);
  }
}

export default SeedTestMultipleProgram;
