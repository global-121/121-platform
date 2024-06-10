import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewIntersolveEntities1717513412071
  implements MigrationInterface
{
  name = 'AddNewIntersolveEntities1717513412071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_child_wallet" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "tokenCode" character varying NOT NULL, "isLinkedToParentWallet" boolean NOT NULL DEFAULT false, "isTokenBlocked" boolean NOT NULL, "isDebitCardCreated" boolean NOT NULL DEFAULT false, "walletStatus" character varying NOT NULL, "cardStatus" character varying, "lastUsedDate" TIMESTAMP, "lastExternalUpdate" TIMESTAMP, "intersolveVisaParentWalletId" integer, CONSTRAINT "UQ_8d14f1ebd6bb4e145692e264c81" UNIQUE ("tokenCode"), CONSTRAINT "PK_4dc8497d497c3f616b95b81bf4a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4612504fc9c5f58e9af93fbb49" ON "121-service"."intersolve_visa_child_wallet" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d14f1ebd6bb4e145692e264c8" ON "121-service"."intersolve_visa_child_wallet" ("tokenCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_parent_wallet" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "intersolveVisaCustomerId" integer NOT NULL, "tokenCode" character varying NOT NULL, "isLinkedToVisaCustomer" boolean NOT NULL DEFAULT false, "balance" integer NOT NULL DEFAULT '0', "lastExternalUpdate" TIMESTAMP, "spentThisMonth" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_9ac897d2fd3f7956e20afbe010a" UNIQUE ("tokenCode"), CONSTRAINT "REL_2975915495fd7289eaad6f4705" UNIQUE ("intersolveVisaCustomerId"), CONSTRAINT "PK_d13a985f2c42065b197689a17e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0829cb1ad9465f0fae9cd408b1" ON "121-service"."intersolve_visa_parent_wallet" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ac897d2fd3f7956e20afbe010" ON "121-service"."intersolve_visa_parent_wallet" ("tokenCode") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ADD CONSTRAINT "FK_59ddd28d67a179d138682da697a" FOREIGN KEY ("intersolveVisaParentWalletId") REFERENCES "121-service"."intersolve_visa_parent_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" ADD CONSTRAINT "FK_2975915495fd7289eaad6f47050" FOREIGN KEY ("intersolveVisaCustomerId") REFERENCES "121-service"."intersolve_visa_customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" DROP CONSTRAINT "FK_2975915495fd7289eaad6f47050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" DROP CONSTRAINT "FK_59ddd28d67a179d138682da697a"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9ac897d2fd3f7956e20afbe010"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0829cb1ad9465f0fae9cd408b1"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_visa_parent_wallet"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8d14f1ebd6bb4e145692e264c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_4612504fc9c5f58e9af93fbb49"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."intersolve_visa_child_wallet"`,
    );
  }
}
