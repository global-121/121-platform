import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import fs from 'fs';
import { ProgramQuestionEntity } from '../src/programs/program-question.entity';
import { ProgramCustomAttributeEntity } from '../src/programs/program-custom-attribute.entity';
import { ProgramEntity } from '../src/programs/program.entity';
import { FspAttributeEntity } from '../src/fsp/fsp-attribute.entity';

export class addShortLabel1658218507582 implements MigrationInterface {
  name = 'addShortLabel1658218507582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD "shortLabel" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD "shortLabel" json`,
    );
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "shortLabel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "shortLabel"`,
    );
  }

  private async migrateData(connection: Connection): Promise<void> {
    const programPilotNL = JSON.parse(
      fs.readFileSync('seed-data/program/program-pilot-nl.json', 'utf8'),
    );
    const programPilotNL2 = JSON.parse(
      fs.readFileSync('seed-data/program/program-pilot-nl-2.json', 'utf8'),
    );
    const fspIntersolve = JSON.parse(
      fs.readFileSync('seed-data/fsp/fsp-intersolve.json', 'utf8'),
    );

    if (programPilotNL && programPilotNL2 && fspIntersolve) {
      const programRepo = connection.getRepository(ProgramEntity);
      const programQuestionsRepo = connection.getRepository(
        ProgramQuestionEntity,
      );
      const program: ProgramEntity | undefined = await programRepo
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
            qJson => qJson.name === q.name,
          );
          q.shortLabel = qJson.shortLabel;
          await programQuestionsRepo.save(q);
        }

        const fspAttributeRepo = connection.getRepository(FspAttributeEntity);

        const fspAttributes = await fspAttributeRepo
          .createQueryBuilder('fspAttribute')
          .select('fspAttribute.id')
          .addSelect('fspAttribute.name')
          .getMany();

        for (const fspAttribute of fspAttributes) {
          const jsonAttribute = fspIntersolve.attributes.find(
            a => a.name === fspAttribute.name,
          );
          if (jsonAttribute) {
            fspAttribute.shortLabel = jsonAttribute.shortLabel;
            fspAttributeRepo.save(fspAttribute);
          }
        }
      }
    }
  }
}
