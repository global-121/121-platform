import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import instanceDemo from '@121-service/src/seed-data/instance/instance-demo.json';
import messageTemplateDemo from '@121-service/src/seed-data/message-template/message-template-demo.json';
import programDemo from '@121-service/src/seed-data/program/program-demo.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedDemoProgram implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programDemo, isApiTests);

    // ***** CREATE MESSAGE TEMPLATE *****
    await this.seedHelper.addMessageTemplates(messageTemplateDemo, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDemo);
  }
}
