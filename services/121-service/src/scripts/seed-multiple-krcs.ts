import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceKRCS from '../../seed-data/instance/instance-krcs.json';
import programBaringo from '../../seed-data/program/program-krcs-baringo.json';
import programTurkana from '../../seed-data/program/program-krcs-turkana.json';
import programWestPokot from '../../seed-data/program/program-krcs-westpokot.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedMultipleKRCS implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(isApiTests?: boolean): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run(isApiTests);

    // ************************
    // ***** Program Baringo *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityBaringo =
      await this.seedHelper.addProgram(programBaringo);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityBaringo, false);

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceKRCS);

    // ************************
    // ***** Program Turkana *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityTurkana =
      await this.seedHelper.addProgram(programTurkana);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityTurkana, false);

    // ************************
    // ***** Program West Pokot *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityWestPokot =
      await this.seedHelper.addProgram(programWestPokot);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityWestPokot, false);
  }
}

export default SeedMultipleKRCS;
