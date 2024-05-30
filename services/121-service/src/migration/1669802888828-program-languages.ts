import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class programLanguages1669802888828 implements MigrationInterface {
  name = 'programLanguages1669802888828';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD IF NOT EXISTS "languages" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner);
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "languages"`,
    );
  }

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    const notifications = await queryRunner.query(
      `SELECT notifications, id from  "121-service"."program"`,
    );
    for (const program of notifications) {
      const languages = Object.keys(program.notifications).map((key) => {
        return key;
      });
      const programRepo = queryRunner.manager.getRepository(ProgramEntity);
      program.languages = languages;
      await programRepo.save(program);
    }
  }
}
