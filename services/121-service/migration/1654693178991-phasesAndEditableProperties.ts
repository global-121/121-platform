import fs from 'fs';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { FspQuestionEntity } from '../src/financial-service-providers/fsp-question.entity';
import { ProgramCustomAttributeEntity } from '../src/programs/program-custom-attribute.entity';
import { ProgramEntity } from '../src/programs/program.entity';
import { ProgramQuestionEntity } from './../src/programs/program-question.entity';

export class PhasesAndEditableProperties1654693178991
  implements MigrationInterface
{
  name = 'PhasesAndEditableProperties1654693178991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN if exists "export"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD "editableInPortal" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD "phases" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD "phases" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "phases" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.commitTransaction();
    // 08-11-2022 migrateData() is commented out as this was causing issues with new entities and legacy migrations.
    // await this.migrateData(queryRunner.manager);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "editableInPortal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "export" json NOT NULL DEFAULT '["all-people-affected","included","selected-for-validation", "payment"]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "phases"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "phases"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "phases"`,
    );
  }

  private async migrateData(manager: EntityManager): Promise<void> {
    let programPilotNL, programPilotNL2, fspIntersolve;
    try {
      // refactor: if encountering issues with these imports, consider refactoring similarly to what was done in https://github.com/global-121/121-platform/pull/5192/files
      programPilotNL = JSON.parse(
        fs.readFileSync('seed-data/program/program-pilot-nl.json', 'utf8'),
      );
      programPilotNL2 = JSON.parse(
        fs.readFileSync('seed-data/program/program-pilot-nl-2.json', 'utf8'),
      );
      // fspIntersolve = JSON.parse(
      //   fs.readFileSync('seed-data/fsp/fsp-intersolve.json', 'utf8'),
      // );
    } catch {
      console.log(
        'NLRC programs not found. Not migrating phases and editable properties for NLRC program',
      );
    }
    if (programPilotNL && programPilotNL2 && fspIntersolve) {
      const programRepo = manager.getRepository(ProgramEntity);
      const programQuestionsRepo = manager.getRepository(ProgramQuestionEntity);
      const customAttributesRepo = manager.getRepository(
        ProgramCustomAttributeEntity,
      );
      const program = await programRepo
        .createQueryBuilder('program')
        .leftJoin('program.programQuestions', 'programQuestion')
        .leftJoin('program.programCustomAttributes', 'programCustomAttribute')
        .select('program.id')
        .addSelect('program.titlePortal')
        .addSelect('program.ngo')
        .addSelect('programQuestion.id')
        .addSelect('programQuestion.name')
        .addSelect('programQuestion.phases')
        .addSelect('programQuestion.editableInPortal')
        .addSelect('programCustomAttribute.id')
        .addSelect('programCustomAttribute.name')
        .addSelect('programCustomAttribute.phases')
        .where(`ngo = 'NLRC'`)
        .getOne();

      if (program) {
        let programJson;
        if (program.titlePortal['en'] === programPilotNL.titlePortal.en) {
          programJson = programPilotNL;
        }
        if (program.titlePortal['en'] === programPilotNL2.titlePortal.en) {
          programJson = programPilotNL2;
        }
        for (const q of program.programQuestions) {
          const qJson = programJson.programQuestions.find(
            (qJson) => qJson.name === q.name,
          );
          q.phases = qJson.phases;
          q.editableInPortal = qJson.editableInPortal;
          await programQuestionsRepo.save(q);
        }
        for (const ca of program.programCustomAttributes) {
          const caJson = programJson.programCustomAttributes.find(
            (caJson) => caJson.name === ca.name,
          );
          ca.phases = caJson.phases;
          await customAttributesRepo.save(ca);
        }
      }

      const fspAttributeRepo = manager.getRepository(FspQuestionEntity);

      const fspAttributes = await fspAttributeRepo
        .createQueryBuilder('fspAttribute')
        .select('fspAttribute.id')
        .addSelect('fspAttribute.name')
        .addSelect('fspAttribute.phases')
        .getMany();

      for (const fspAttribute of fspAttributes) {
        if (fspAttribute.name === fspIntersolve.attributes[0].name) {
          fspAttribute.phases = fspIntersolve.attributes[0].phases;
          await fspAttributeRepo.save(fspAttribute);
        }
      }
    }
  }
}
