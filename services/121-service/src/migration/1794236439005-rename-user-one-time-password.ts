import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserOneTimePassword1794236439005
  implements MigrationInterface
{
  name = 'RenameUserOneTimePassword1794236439005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_otp" RENAME TO "user_one_time_password"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_one_time_password" RENAME COLUMN "otp" TO "oneTimePassword"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "121-service"."user_otp_id_seq" RENAME TO "user_one_time_password_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_one_time_password" RENAME CONSTRAINT "PK_494c022ed33e6ee19a2bbb11b22" TO "PK_4a8ae3468b5a7bea037ca5f68ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_one_time_password" RENAME CONSTRAINT "REL_bd81461d078fe46743dd535fb2" TO "REL_698e846ae299b839cb499c2f92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_one_time_password" RENAME CONSTRAINT "FK_bd81461d078fe46743dd535fb27" TO "FK_698e846ae299b839cb499c2f923"`,
    );
    await queryRunner.query(
      `ALTER INDEX "121-service"."IDX_8c0be42f1f1c898b7b16dc11ba" RENAME TO "IDX_52ad7710360db75bc1962591ea"`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
