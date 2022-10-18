import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

import fspIntersolve from '../../seed-data/fsp/fsp-intersolve.json';
import fspIntersolveNoWhatsapp from '../../seed-data/fsp/fsp-intersolve-no-whatsapp.json';
import fspBank from '../../seed-data/fsp/fsp-bank.json';
import fspMixedAttributes from '../../seed-data/fsp/fsp-mixed-attributes.json';
import fspNoAttributes from '../../seed-data/fsp/fsp-no-attributes.json';
import fspAfricasTalking from '../../seed-data/fsp/fsp-africas-talking.json';

import instanceDemo from '../../seed-data/instance/instance-demo.json';

import programDemo from '../../seed-data/program/program-demo.json';
import programTest from '../../seed-data/program/program-test.json';
import programValidation from '../../seed-data/program/program-validation.json';

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
    await this.seedHelper.addFsp(fspAfricasTalking);
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMixedAttributes);
    await this.seedHelper.addFsp(fspNoAttributes);

    // ************************
    // ***** Program Demo *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityDemo = await this.seedHelper.addProgram(programDemo);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(programEntityDemo, false);

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceDemo);

    // ************************
    // ***** Program Test *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityTest = await this.seedHelper.addProgram(programTest);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(programEntityTest, false);

    // ******************************
    // ***** Program Validation *****
    // ******************************

    // ***** CREATE PROGRAM *****
    const programEntityValidation = await this.seedHelper.addProgram(
      programValidation,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    this.seedHelper.addDefaultUsers(programEntityValidation, false);
  }
}

export default SeedTestMultipleProgram;
