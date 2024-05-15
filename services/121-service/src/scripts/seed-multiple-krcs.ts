import { Injectable } from '@nestjs/common';
import instanceKRCS from '../../seed-data/instance/instance-krcs.json';
import messageTemplateBaringo from '../../seed-data/message-template/message-template-krcs-baringo.json';
import messageTemplateTurkana from '../../seed-data/message-template/message-template-krcs-turkana.json';
import messageTemplateWestPokot from '../../seed-data/message-template/message-template-krcs-westpokot.json';
import programBaringo from '../../seed-data/program/program-krcs-baringo.json';
import programTurkana from '../../seed-data/program/program-krcs-turkana.json';
import programWestPokot from '../../seed-data/program/program-krcs-westpokot.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';

@Injectable()
export class SeedMultipleKRCS implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests?: boolean): Promise<void> {
    // ************************
    // ***** Program Baringo *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityBaringo = await this.seedHelper.addProgram(
      programBaringo,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateBaringo,
      programEntityBaringo,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityBaringo);

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceKRCS);

    // ************************
    // ***** Program Turkana *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityTurkana = await this.seedHelper.addProgram(
      programTurkana,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateTurkana,
      programEntityTurkana,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityTurkana);

    // ************************
    // ***** Program West Pokot *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityWestPokot = await this.seedHelper.addProgram(
      programWestPokot,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateWestPokot,
      programEntityWestPokot,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityWestPokot);
  }
}
