import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import fspIntersolveNoWhatsapp from '../../seed-data/fsp/fsp-intersolve-voucher-paper.json';
import fspIntersolve from '../../seed-data/fsp/fsp-intersolve-voucher-whatsapp.json';
import instanceAnonymous from '../../seed-data/instance/instance-anonymous.json';
import programValidation from '../../seed-data/program/program-validation.json';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedProgramValidation implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.dataSource);
    await seedInit.run();

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspIntersolveNoWhatsapp);

    // ***** CREATE PROGRAM *****
    const program = await this.seedHelper.addProgram(programValidation);

    this.seedHelper.addDefaultUsers(program, true);

    // ***** CREATE INSTANCE *****
    await this.seedHelper.addInstance(instanceAnonymous);
  }
}

export default SeedProgramValidation;
