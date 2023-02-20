import { MigrationInterface, QueryRunner } from 'typeorm';

export class intersolveVisa1675939675663 implements MigrationInterface {
  name = 'intersolveVisa1675939675663';

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_card" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "success" boolean, "tokenCode" character varying, "tokenBlocked" boolean, "expiresAt" character varying, "status" character varying, "registrationId" integer, CONSTRAINT "REL_c990ae558463cd0116cf6dc3e8" UNIQUE ("registrationId"), CONSTRAINT "PK_ad0d5b893e3726602f7822c6f29" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_571e8d4fb00bd19be71ec359c9" ON "121-service"."intersolve_visa_card" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5859fe005b0a7fb606f6f191c5" ON "121-service"."intersolve_visa_card" ("tokenCode") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card" ADD CONSTRAINT "FK_c990ae558463cd0116cf6dc3e86" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card" DROP CONSTRAINT "FK_c990ae558463cd0116cf6dc3e86"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5859fe005b0a7fb606f6f191c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_571e8d4fb00bd19be71ec359c9"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."intersolve_visa_card"`);
  }
}
