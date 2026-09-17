import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramScopeCalculation1789641906877 implements MigrationInterface {
  name = 'ProgramScopeCalculation1789641906877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "scopeRegistrationAttributeNames" json`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "scopeRegistrationAttributeNames"`,
    );
  }
}
