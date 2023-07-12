import { MigrationInterface, QueryRunner } from 'typeorm';

export class visaCustomerWallet1ToMany1688543280607
  implements MigrationInterface
{
  name = 'visaCustomerWallet1ToMany1688543280607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_f444f4ba8389dd18e6f1fdc3f9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP COLUMN "blocked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "UQ_f444f4ba8389dd18e6f1fdc3f9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP COLUMN "visaWalletId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "balance" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "status" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "lastUsedDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "intersolveVisaCustomerId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD CONSTRAINT "FK_31af0c41cd9ca79877f29b52f44" FOREIGN KEY ("intersolveVisaCustomerId") REFERENCES "121-service"."intersolve_visa_customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP CONSTRAINT "FK_31af0c41cd9ca79877f29b52f44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "intersolveVisaCustomerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "lastUsedDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "balance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD "visaWalletId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "UQ_f444f4ba8389dd18e6f1fdc3f9b" UNIQUE ("visaWalletId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD "blocked" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_f444f4ba8389dd18e6f1fdc3f9b" FOREIGN KEY ("visaWalletId") REFERENCES "121-service"."intersolve_visa_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
