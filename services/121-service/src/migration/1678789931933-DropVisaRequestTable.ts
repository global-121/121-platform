import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropVisaRequestTable1678789931933 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
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
  }
}
