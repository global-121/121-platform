import { MigrationInterface, QueryRunner } from 'typeorm';

export class multipleProgramUniqueAttributes1664464981314
  implements MigrationInterface {
  name = 'multipleProgramUniqueAttributes1664464981314';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_deab61a6961866dafe5ce61426"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "FK_b34adfcf6ebd3c2536d35dfbf6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ALTER COLUMN "programId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "FK_73c4bbddef1ccb565239e250b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ALTER COLUMN "programId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ALTER COLUMN "fspId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "programQuestionUnique" UNIQUE ("name", "programId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "programCustomAttributeUnique" UNIQUE ("name", "programId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "fspQuestionUnique" UNIQUE ("name", "fspId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "FK_b34adfcf6ebd3c2536d35dfbf6c" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "FK_73c4bbddef1ccb565239e250b59" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "FK_73c4bbddef1ccb565239e250b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "FK_b34adfcf6ebd3c2536d35dfbf6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "fspQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "programCustomAttributeUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP CONSTRAINT "programQuestionUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ALTER COLUMN "fspId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ALTER COLUMN "programId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "FK_73c4bbddef1ccb565239e250b59" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ALTER COLUMN "programId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD CONSTRAINT "FK_b34adfcf6ebd3c2536d35dfbf6c" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_deab61a6961866dafe5ce61426" ON "121-service"."program_question" ("name") `,
    );
  }
}
