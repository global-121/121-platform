import { MigrationInterface, QueryRunner } from 'typeorm';

export class addRegistrationProgramIdColumn1667984005227
  implements MigrationInterface {
  name = 'addRegistrationProgramIdColumn1667984005227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "registrationProgramId" integer`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."registration" SET "registrationProgramId" = "id"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IDX_unique_registrationProgramIds ON "121-service"."registration"("programId", "registrationProgramId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "registrationProgramId"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_unique_registrationProgramIds"`,
    );
  }
}
