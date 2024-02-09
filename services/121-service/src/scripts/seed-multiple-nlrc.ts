import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceNLRC from '../../seed-data/instance/instance-nlrc.json';
import messageTemplateOCW from '../../seed-data/message-template/message-template-nlrc-ocw.json';
import messageTemplatePV from '../../seed-data/message-template/message-template-nlrc-pv.json';
import programOCW from '../../seed-data/program/program-nlrc-ocw.json';
import programPV from '../../seed-data/program/program-nlrc-pv.json';
import { MessageTemplateService } from '../notifications/message-template/message-template.service';
import { DebugScope } from './enum/debug-scope.enum';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';

@Injectable()
export class SeedMultipleNLRC implements InterfaceScript {
  public constructor(
    private dataSource: DataSource,
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  private readonly seedHelper = new SeedHelper(
    this.dataSource,
    this.messageTemplateService,
  );

  public async run(isApiTests?: boolean): Promise<void> {
    const debugScopes = Object.values(DebugScope);
    const seedInit = new SeedInit(this.dataSource, this.messageTemplateService);
    await seedInit.run(isApiTests);

    // ***** CREATE INSTANCE *****
    // Technically multiple instances could be loaded, but that should not be done
    await this.seedHelper.addInstance(instanceNLRC);

    // ***** SET SEQUENCE *****
    // This is to keep PV and OCW program ids on respectively 2 and 3
    // This to prevent differences between our local and prod dbs so we are less prone to mistakes
    await this.dataSource.query(
      `ALTER SEQUENCE "121-service".program_id_seq RESTART WITH 2;`,
    );

    // ************************
    // ***** Program PV *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityPV = await this.seedHelper.addProgram(
      programPV,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplatePV,
      programEntityPV,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityPV, debugScopes);

    // ************************
    // ***** Program OCW *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityOCW = await this.seedHelper.addProgram(
      programOCW,
      isApiTests,
    );

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateOCW,
      programEntityOCW,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityOCW, debugScopes);
  }
}

export default SeedMultipleNLRC;
