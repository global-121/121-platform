import { MigrationInterface, QueryRunner } from 'typeorm';

export class RoleDescription1727853835967 implements MigrationInterface {
  name = 'RoleDescription1727853835967';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role" ADD "description" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role" DROP COLUMN "description"`,
    );
  }
}
