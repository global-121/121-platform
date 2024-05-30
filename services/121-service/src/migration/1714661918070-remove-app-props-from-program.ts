import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAppPropsFromProgram1714661918070
  implements MigrationInterface
{
  name = 'RemoveAppPropsFromProgram1714661918070';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program"
        DROP COLUMN "titlePaApp",
        DROP COLUMN "phoneNumberPlaceholder";`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "titlePaApp" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "phoneNumberPlaceholder" character varying`,
    );
  }
}
