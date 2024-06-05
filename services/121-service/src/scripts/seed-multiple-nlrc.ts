import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import instanceNLRC from '@121-service/src/seed-data/instance/instance-nlrc.json';
import messageTemplateOCW from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.json';
import messageTemplatePV from '@121-service/src/seed-data/message-template/message-template-nlrc-pv.json';
import programOCW from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import programPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SeedMultipleNLRC implements InterfaceScript {
  public constructor(
    private dataSource: DataSource,
    private readonly seedHelper: SeedHelper,
  ) {}

  public async run(isApiTests = false): Promise<void> {
    const debugScopes = Object.values(DebugScope);

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
