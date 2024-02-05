import { MigrationInterface, QueryRunner } from 'typeorm';

export class VisaCardToWallet1678278494087 implements MigrationInterface {
  name = 'VisaCardToWallet1678278494087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT IF EXISTS "FK_70d1231a6094f1151ec92303a83"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_wallet" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "tokenCode" character varying, "type" character varying, "tokenBlocked" boolean, "status" character varying, "cardUrl" character varying, "controlToken" character varying, CONSTRAINT "UQ_9517f2566788e1ebf763ba4d1fa" UNIQUE ("tokenCode"), CONSTRAINT "PK_d1081a09d40748cfcd636832cdd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6507d7eb75b172f8c1c189ff3b" ON "121-service"."intersolve_visa_wallet" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9517f2566788e1ebf763ba4d1f" ON "121-service"."intersolve_visa_wallet" ("tokenCode") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_70d1231a6094f1151ec92303a83" FOREIGN KEY ("visaCardId") REFERENCES "121-service"."intersolve_visa_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."intersolve_visa_card"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_card" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "success" boolean, "tokenCode" character varying, "tokenBlocked" boolean, "expiresAt" character varying, "status" character varying, CONSTRAINT "UQ_5859fe005b0a7fb606f6f191c50" UNIQUE ("tokenCode"), CONSTRAINT "PK_ad0d5b893e3726602f7822c6f29" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_70d1231a6094f1151ec92303a83"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9517f2566788e1ebf763ba4d1f"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_6507d7eb75b172f8c1c189ff3b"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_visa_wallet"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_70d1231a6094f1151ec92303a83" FOREIGN KEY ("visaCardId") REFERENCES "121-service"."intersolve_visa_card"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
