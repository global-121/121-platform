import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspIntersolveNoWhatsapp from '../../seed-data/fsp/fsp-intersolve-no-whatsapp.json';
import fspVodacash from '../../seed-data/fsp/fsp-vodacash.json';

import programPilotNLLVV from '../../seed-data/program/program-pilot-nl.json';
import instancePilotNLLVV from '../../seed-data/instance/instance-pilot-nl.json';

import programPilotNLPV from '../../seed-data/program/program-pilot-nl-2.json';
import instancePilotNLPV from '../../seed-data/instance/instance-pilot-nl-2.json';

import programDrc from '../../seed-data/program/program-drc.json';
import intanceDrc from '../../seed-data/instance/instance-drc.json';

@Injectable()
export class SeedTestMultipleProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspIntersolveNoWhatsapp);
    await this.seedHelper.addFsp(fspVodacash);

    // ****************
    // ***** NLRC *****
    // ****************

    // ***** CREATE PROGRAM *****
    const programEntityNLLVV = await this.seedHelper.addProgram(
      programPilotNLLVV,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(programEntityNLLVV, false);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instancePilotNLLVV);

    // Seeding NLRC-PV and LVV together does not work yet until we implement many to many program - programQuestions
    // // *******************
    // // ***** NLRC-PV *****

    // // *******************
    // // ***** CREATE PROGRAM *****
    // const programEntityNLPV = await this.seedHelper.addProgram(
    //   programPilotNLPV,
    // );

    // // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    // this.seedHelper.addDefaultUsers(programEntityNLPV, false);

    // // ***** CREATE INSTANCE *****
    // await this.seedHelper.addInstance(instancePilotNLPV);

    // *******************
    // ***** NLRC-PV *****
    // *******************

    // ***** CREATE PROGRAM *****
    const programEntityDrc = await this.seedHelper.addProgram(programDrc);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(programEntityDrc, false);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(intanceDrc);
  }
}

export default SeedTestMultipleProgram;
