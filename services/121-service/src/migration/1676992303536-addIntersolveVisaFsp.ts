import { MigrationInterface, QueryRunner } from 'typeorm';
export class addIntersolveVisaFsp1676992303536 implements MigrationInterface {
  name = 'addIntersolveVisaFsp1676992303536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_request" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "reference" character varying NOT NULL, "saleId" character varying, "endpoint" character varying, "statusCode" integer, "metadata" json, CONSTRAINT "PK_3784db8ae7bdd6beeb9a5639c2c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae2adce98d8057bcb1d14cb346" ON "121-service"."intersolve_visa_request" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_438f856b7c9c6ad6274ad44f6f" ON "121-service"."intersolve_visa_request" ("reference") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98ffc5f840df6cfb2b02bf2600" ON "121-service"."intersolve_visa_request" ("endpoint") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_card" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "success" boolean, "tokenCode" character varying, "tokenBlocked" boolean, "expiresAt" character varying, "status" character varying, CONSTRAINT "UQ_5859fe005b0a7fb606f6f191c50" UNIQUE ("tokenCode"), CONSTRAINT "PK_ad0d5b893e3726602f7822c6f29" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_571e8d4fb00bd19be71ec359c9" ON "121-service"."intersolve_visa_card" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5859fe005b0a7fb606f6f191c5" ON "121-service"."intersolve_visa_card" ("tokenCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_customer" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "blocked" boolean, "holderId" character varying, "registrationId" integer, "visaCardId" integer, CONSTRAINT "REL_ad00c730226a462624de94041e" UNIQUE ("registrationId"), CONSTRAINT "REL_70d1231a6094f1151ec92303a8" UNIQUE ("visaCardId"), CONSTRAINT "PK_4e102a56ae70e53cfbfbe428d93" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76c1670fcb023cd7c2ce88c9b1" ON "121-service"."intersolve_visa_customer" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_515c96e866cf596a8ceff97330" ON "121-service"."intersolve_visa_customer" ("holderId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" ADD "notifyOnTransaction" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_ad00c730226a462624de94041ec" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_70d1231a6094f1151ec92303a83" FOREIGN KEY ("visaCardId") REFERENCES "121-service"."intersolve_visa_card"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_70d1231a6094f1151ec92303a83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_ad00c730226a462624de94041ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" DROP COLUMN "notifyOnTransaction"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_515c96e866cf596a8ceff97330"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_76c1670fcb023cd7c2ce88c9b1"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_visa_customer"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5859fe005b0a7fb606f6f191c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_571e8d4fb00bd19be71ec359c9"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."intersolve_visa_card"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_98ffc5f840df6cfb2b02bf2600"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_438f856b7c9c6ad6274ad44f6f"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ae2adce98d8057bcb1d14cb346"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_visa_request"`,
    );
  }
}
