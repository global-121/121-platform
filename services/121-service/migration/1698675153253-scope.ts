import { MigrationInterface, QueryRunner } from "typeorm";

// TODO Recreate this migrations together for all other scoped entities

export class Scope1698675153253 implements MigrationInterface {
    name = 'Scope1698675153253'

    public async up(queryRunner: QueryRunner): Promise<void> {

      await queryRunner.query(`ALTER TABLE "121-service"."registration" ADD "scope" character varying`);
      await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" add "scope" character varying`);
      await queryRunner.query(`ALTER TABLE "121-service"."note" ADD "scope" character varying`);

    }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "121-service"."registration" DROP COLUMN "scope"`);
    await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" DROP COLUMN "scope"`);

    }

}
