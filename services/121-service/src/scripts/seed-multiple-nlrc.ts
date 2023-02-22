import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import fspIntersolveVisa from '../../seed-data/fsp/fsp-intersolve-visa.json';
import fspIntersolveNoWhatsapp from '../../seed-data/fsp/fsp-intersolve-voucher-paper.json';
import fspIntersolve from '../../seed-data/fsp/fsp-intersolve-voucher-whatsapp.json';
import instanceLVV from '../../seed-data/instance/instance-pilot-nl.json';
import programOCW from '../../seed-data/program/program-nlrc-ocw.json';
import programPV from '../../seed-data/program/program-pilot-nl-2.json';
import programLVV from '../../seed-data/program/program-pilot-nl.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedMultipleNLRC implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspIntersolveNoWhatsapp);
    await this.seedHelper.addFsp(fspIntersolveVisa);

    // ************************
    // ***** Program LVV *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityLVV = await this.seedHelper.addProgram(programLVV);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityLVV, true);

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceLVV);

    // ************************
    // ***** Program PV *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityPV = await this.seedHelper.addProgram(programPV);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityPV, true);

    // ************************
    // ***** Program OCW *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityOCW = await this.seedHelper.addProgram(programOCW);

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityOCW, true);
  }
}

export default SeedMultipleNLRC;
