import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingVisa1720183099461 implements MigrationInterface {
  name = 'PendingVisa1720183099461';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" DROP CONSTRAINT "FK_59ddd28d67a179d138682da697a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ALTER COLUMN "intersolveVisaParentWalletId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ALTER COLUMN "isTokenBlocked" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ALTER COLUMN "lastExternalUpdate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" ALTER COLUMN "lastExternalUpdate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59ddd28d67a179d138682da697" ON "121-service"."intersolve_visa_child_wallet" ("intersolveVisaParentWalletId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ADD CONSTRAINT "FK_59ddd28d67a179d138682da697a" FOREIGN KEY ("intersolveVisaParentWalletId") REFERENCES "121-service"."intersolve_visa_parent_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" DROP CONSTRAINT "FK_59ddd28d67a179d138682da697a"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_59ddd28d67a179d138682da697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_parent_wallet" ALTER COLUMN "lastExternalUpdate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ALTER COLUMN "lastExternalUpdate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ALTER COLUMN "isTokenBlocked" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ALTER COLUMN "intersolveVisaParentWalletId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_child_wallet" ADD CONSTRAINT "FK_59ddd28d67a179d138682da697a" FOREIGN KEY ("intersolveVisaParentWalletId") REFERENCES "121-service"."intersolve_visa_parent_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
