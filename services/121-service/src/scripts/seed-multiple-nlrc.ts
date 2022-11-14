import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import fspIntersolveNoWhatsapp from '../../seed-data/fsp/fsp-intersolve-no-whatsapp.json';
import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import instanceLVV from '../../seed-data/instance/instance-pilot-nl.json';
import programPV from '../../seed-data/program/program-pilot-nl-2.json';
import programLVV from '../../seed-data/program/program-pilot-nl.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedMultipleNLRC implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspIntersolveNoWhatsapp);

    // ************************
    // ***** Program LVV *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityLVV = await this.seedHelper.addProgram(programLVV);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(programEntityLVV, true);

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceLVV);

    // ************************
    // ***** Program PV *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityPV = await this.seedHelper.addProgram(programPV);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(programEntityPV, true);
  }
}

export default SeedMultipleNLRC;
