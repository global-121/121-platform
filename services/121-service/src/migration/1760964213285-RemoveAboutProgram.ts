import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAboutProgram1760964213285 implements MigrationInterface {
  name = 'RemoveAboutProgram1760964213285';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "aboutProgram"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "aboutProgram" json`,
    );
  }
}
