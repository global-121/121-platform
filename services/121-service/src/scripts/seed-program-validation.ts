import instanceAnonymous from '@121-service/seed-data/instance/instance-anonymous.json';
import messageTemplateValidation from '@121-service/seed-data/message-template/message-template-validation.json';
import programValidation from '@121-service/seed-data/program/program-validation.json';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedProgramValidation implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(
      programValidation,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateValidation,
      program,
    );

    await this.seedHelper.addDefaultUsers(program);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceAnonymous);
  }
}
