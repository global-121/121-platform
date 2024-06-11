import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import messageTemplateBaringo from '@121-service/src/seed-data/message-template/message-template-krcs-baringo.json';
import messageTemplateTurkana from '@121-service/src/seed-data/message-template/message-template-krcs-turkana.json';
import messageTemplateWestPokot from '@121-service/src/seed-data/message-template/message-template-krcs-westpokot.json';
import organizationKRCS from '@121-service/src/seed-data/organization/organization-krcs.json';
import programBaringo from '@121-service/src/seed-data/program/program-krcs-baringo.json';
import programTurkana from '@121-service/src/seed-data/program/program-krcs-turkana.json';
import programWestPokot from '@121-service/src/seed-data/program/program-krcs-westpokot.json';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedMultipleKRCS implements InterfaceScript {
  public constructor(private readonly seedHelper: SeedHelper) {}

  public async run(isApiTests = false): Promise<void> {
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

    // ***** CREATE ORGANIZATION *****
    // Technically multiple organizations could be loaded, but that should not be done
    await this.seedHelper.addOrganization(organizationKRCS);

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
