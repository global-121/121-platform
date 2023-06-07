import { MigrationInterface, QueryRunner } from 'typeorm';

export class VisaDebitCard1686149916530 implements MigrationInterface {
  name = 'VisaDebitCard1686149916530';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_70d1231a6094f1151ec92303a83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "controlToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "cardUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "REL_70d1231a6094f1151ec92303a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" DROP COLUMN "visaCardId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "linkedToVisaCustomer" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "debitCardCreated" boolean NOT NULL DEFAULT false`,
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
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "debitCardCreated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "linkedToVisaCustomer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD "visaCardId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "REL_70d1231a6094f1151ec92303a8" UNIQUE ("visaCardId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "cardUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "status" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "type" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "controlToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_70d1231a6094f1151ec92303a83" FOREIGN KEY ("visaCardId") REFERENCES "121-service"."intersolve_visa_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
