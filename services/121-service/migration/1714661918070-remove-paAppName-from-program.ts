import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePaAppNameFromProgram1714661918070
  implements MigrationInterface
{
  name = 'RemovePaAppNameFromProgram1714661918070';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "titlePaApp"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "titlePaApp" json`,
    );
  }
}
