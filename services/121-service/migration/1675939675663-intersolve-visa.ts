import { MigrationInterface, QueryRunner } from 'typeorm';

export class intersolveVisa1675939675663 implements MigrationInterface {
  name = 'intersolveVisa1675939675663';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_issue_token_request" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "reference" character varying NOT NULL, "saleId" character varying, "statusCode" integer, CONSTRAINT "PK_ba130ca61c8ecea35de395d925e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c87a9cb844e5609ef0e7be1f5e" ON "121-service"."intersolve_issue_token_request" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09094c237b75643258de3698b8" ON "121-service"."intersolve_issue_token_request" ("reference") `,
    );
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
      `CREATE TABLE "121-service"."intersolve_load_request" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "reference" character varying NOT NULL, "saleId" character varying, "tokenCode" character varying, "quantityValue" integer NOT NULL, "statusCode" integer, CONSTRAINT "PK_1be300bde96efa60282e02583b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4799c2a34da36c61813d9f2092" ON "121-service"."intersolve_load_request" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e804927e6edf32b88afffe5493" ON "121-service"."intersolve_load_request" ("reference") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e34ff65dde8122e6c647fdcc1" ON "121-service"."intersolve_load_request" ("tokenCode") `,
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
      `DROP INDEX "121-service"."IDX_1e34ff65dde8122e6c647fdcc1"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e804927e6edf32b88afffe5493"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_4799c2a34da36c61813d9f2092"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_load_request"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5859fe005b0a7fb606f6f191c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_571e8d4fb00bd19be71ec359c9"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."intersolve_visa_card"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_09094c237b75643258de3698b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_c87a9cb844e5609ef0e7be1f5e"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_issue_token_request"`,
    );
  }
}
