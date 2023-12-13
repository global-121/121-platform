import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import instanceNLRC from '../../seed-data/instance/instance-nlrc.json';
import messageTemplateLVV from '../../seed-data/message-template/message-template-nlrc-lvv.json';
import messageTemplateOCW from '../../seed-data/message-template/message-template-nlrc-ocw.json';
import messageTemplatePV from '../../seed-data/message-template/message-template-nlrc-pv.json';
import programLVV from '../../seed-data/program/program-nlrc-lvv.json';
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

    // ************************
    // ***** Program LVV *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityLVV = await this.seedHelper.addProgram(programLVV);

    // ***** CREATE MESSAGE TEMPLATES *****
    await this.seedHelper.addMessageTemplates(
      messageTemplateLVV,
      programEntityLVV,
    );

    // ***** ASSIGN AIDWORKER TO PROGRAM WITH ROLES *****
    await this.seedHelper.addDefaultUsers(programEntityLVV, debugScopes);

    // ************************
    // ***** Program PV *****
    // ************************

    // ***** CREATE PROGRAM *****
    const programEntityPV = await this.seedHelper.addProgram(programPV);

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
    const programEntityOCW = await this.seedHelper.addProgram(programOCW);

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
