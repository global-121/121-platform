import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOtp1793096048556 implements MigrationInterface {
  name = 'UserOtp1793096048556';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."user_otp" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "otp" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "consumedAt" TIMESTAMP, "failedAttempts" integer NOT NULL DEFAULT '0', CONSTRAINT "REL_bd81461d078fe46743dd535fb2" UNIQUE ("userId"), CONSTRAINT "PK_494c022ed33e6ee19a2bbb11b22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c0be42f1f1c898b7b16dc11ba" ON "121-service"."user_otp" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_otp" ADD CONSTRAINT "FK_bd81461d078fe46743dd535fb27" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log("we don't go down")
  }
}
