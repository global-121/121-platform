import { MigrationInterface, QueryRunner } from 'typeorm';

export class addRegistrationProgramIdColumn1667984005227
  implements MigrationInterface
{
  name = 'addRegistrationProgramIdColumn1667984005227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "registrationProgramId" integer`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."registration" SET "registrationProgramId" = "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "registrationProgramId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "registrationProgramUnique" UNIQUE ("programId", "registrationProgramId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "registrationProgramUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "registrationProgramId"`,
    );
  }
}
