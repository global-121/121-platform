import instanceDemo from '@121-service/seed-data/instance/instance-demo.json';
import messageTemplateTest from '@121-service/seed-data/message-template/message-template-test.json';
import programTest from '@121-service/seed-data/program/program-test.json';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedTestProgram implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programTest, isApiTests);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(messageTemplateTest, program);

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceDemo);
  }
}
