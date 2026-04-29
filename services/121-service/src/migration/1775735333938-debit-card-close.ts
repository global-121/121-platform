import { MigrationInterface, QueryRunner } from 'typeorm';

export class DebitCardClose1775735333938 implements MigrationInterface {
  name = 'DebitCardClose1775735333938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Not assigning the permission to a role since this will be done by the support team when the feature is enabled
    // this permission is not relevant for our default roles and only in the netherlands
    await queryRunner.query(`
      INSERT INTO "121-service"."permission" ("name")
      VALUES ('fsp:debit-card.close')
    `);

    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_wallet_closure" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "intersolveVisaChildWalletId" integer NOT NULL, "amountBookedBackInCents" integer NOT NULL, CONSTRAINT "REL_211d0fbad2e3b228f13ebd8c88" UNIQUE ("intersolveVisaChildWalletId"), CONSTRAINT "PK_edc3f867b0ce0427217d3f9efbb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1029bced39fa9f2875a4bb26db" ON "121-service"."intersolve_visa_wallet_closure" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet_closure" ADD CONSTRAINT "FK_211d0fbad2e3b228f13ebd8c88e" FOREIGN KEY ("intersolveVisaChildWalletId") REFERENCES "121-service"."intersolve_visa_child_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('never down');
  }
}
