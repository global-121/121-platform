import { MigrationInterface, QueryRunner } from 'typeorm';

export class VoucherPaymentRelation1755852548143 implements MigrationInterface {
  name = 'VoucherPaymentRelation1755852548143';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_c67b949a993d791ba90557fa7b" ON "121-service"."intersolve_voucher" ("paymentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ADD CONSTRAINT "FK_c67b949a993d791ba90557fa7be" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" DROP CONSTRAINT "FK_c67b949a993d791ba90557fa7be"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_c67b949a993d791ba90557fa7b"`,
    );
  }
}
