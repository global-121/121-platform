import { MigrationInterface, QueryRunner } from 'typeorm';

export class intersolveVoucherRename1676469698577
  implements MigrationInterface
{
  name = 'intersolveVoucherRename1676469698577';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Handwritten migration, because TypeORM doesn't support renaming tables yet:
    await queryRunner.query(
      `ALTER TABLE "121-service".intersolve_request RENAME TO intersolve_issue_voucher_request`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service".intersolve_instruction RENAME TO intersolve_voucher_instruction`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service".intersolve_barcode RENAME TO intersolve_voucher`,
    );
    await queryRunner.query(
      `UPDATE "121-service".fsp SET fsp = 'Intersolve-voucher-whatsapp' WHERE fsp = 'Intersolve-whatsapp'`,
    );
    await queryRunner.query(
      `UPDATE "121-service".fsp SET fsp = 'Intersolve-voucher-paper' WHERE fsp = 'Intersolve-no-whatsapp'`,
    );

    // Generated migration:
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_aef8b3f9b3e14b63f1f414e814d"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2324fbeeaf2f98950c20b1d845"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e914753ffd9085b51c2d34f49c"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2ea2587dfd620c3daaf7256ee0"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0c44a38cc8ecd52da40a1e39f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_87475bf1f4196cbe646125e503"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_46d83e95510e1d9f01e3b78043"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_91c99a8ddc738e88f197369431"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" RENAME COLUMN "barcodeId" TO "voucherId"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."intersolve_voucher_id_seq" OWNED BY "121-service"."intersolve_voucher"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."intersolve_voucher_id_seq"')`,
    );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."intersolve_voucher" ALTER COLUMN "id" DROP DEFAULT`,
    // );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."intersolve_issue_voucher_request_id_seq" OWNED BY "121-service"."intersolve_issue_voucher_request"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_issue_voucher_request" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."intersolve_issue_voucher_request_id_seq"')`,
    );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."intersolve_issue_voucher_request" ALTER COLUMN "id" DROP DEFAULT`,
    // );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."intersolve_voucher_instruction_id_seq" OWNED BY "121-service"."intersolve_voucher_instruction"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."intersolve_voucher_instruction_id_seq"')`,
    );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."intersolve_voucher_instruction" ALTER COLUMN "id" DROP DEFAULT`,
    // );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee6a0e9902c20f551b26a950e4" ON "121-service"."intersolve_voucher" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e5fbb222050a60938ec29164e" ON "121-service"."intersolve_voucher" ("send") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7eb47d01b99f7daeb68e61b722" ON "121-service"."intersolve_voucher" ("balanceUsed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f2a0908936af5cc359419d725" ON "121-service"."intersolve_voucher" ("lastRequestedBalance") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e20a5543edc05c7caebb67c2e8" ON "121-service"."intersolve_voucher" ("reminderCount") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acb85e635e1480f24ec1f54025" ON "121-service"."intersolve_issue_voucher_request" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_320cb16ea732c4026206aa698a" ON "121-service"."intersolve_voucher_instruction" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_e64e394d9af2d9096bd29732ab6" FOREIGN KEY ("voucherId") REFERENCES "121-service"."intersolve_voucher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `SELECT setval('121-service.intersolve_issue_voucher_request_id_seq', (SELECT MAX(id) FROM "121-service"."intersolve_issue_voucher_request")+ 1)`,
    );
    await queryRunner.query(
      `SELECT setval('121-service.intersolve_voucher_id_seq', (SELECT MAX(id) FROM "121-service"."intersolve_voucher")+ 1)`,
    );
    await queryRunner.query(
      `SELECT setval('121-service.intersolve_voucher_instruction_id_seq', (SELECT MAX(id) FROM "121-service"."intersolve_voucher_instruction")+ 1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service".intersolve_issue_voucher_request RENAME TO intersolve_request`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service".intersolve_voucher_instruction RENAME TO intersolve_instruction`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service".intersolve_voucher RENAME TO intersolve_barcode`,
    );
    await queryRunner.query(
      `UPDATE "121-service".fsp SET fsp = 'Intersolve-whatsapp' WHERE fsp = 'Intersolve-voucher-whatsapp'`,
    );
    await queryRunner.query(
      `UPDATE "121-service".fsp SET fsp = 'Intersolve-no-whatsapp' WHERE fsp = 'Intersolve-voucher-paper'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" DROP CONSTRAINT "FK_e64e394d9af2d9096bd29732ab6"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_320cb16ea732c4026206aa698a"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_acb85e635e1480f24ec1f54025"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e20a5543edc05c7caebb67c2e8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0f2a0908936af5cc359419d725"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_7eb47d01b99f7daeb68e61b722"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_4e5fbb222050a60938ec29164e"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ee6a0e9902c20f551b26a950e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ALTER COLUMN "id" SET DEFAULT nextval('"121-service".intersolve_instruction_id_seq')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP SEQUENCE "121-service"."intersolve_voucher_instruction_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_issue_voucher_request" ALTER COLUMN "id" SET DEFAULT nextval('"121-service".intersolve_request_id_seq')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_issue_voucher_request" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP SEQUENCE "121-service"."intersolve_issue_voucher_request_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ALTER COLUMN "id" SET DEFAULT nextval('"121-service".intersolve_barcode_id_seq')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `DROP SEQUENCE "121-service"."intersolve_voucher_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" RENAME COLUMN "voucherId" TO "barcodeId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91c99a8ddc738e88f197369431" ON "121-service"."intersolve_voucher_instruction" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46d83e95510e1d9f01e3b78043" ON "121-service"."intersolve_issue_voucher_request" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87475bf1f4196cbe646125e503" ON "121-service"."intersolve_voucher" ("reminderCount") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c44a38cc8ecd52da40a1e39f4" ON "121-service"."intersolve_voucher" ("lastRequestedBalance") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ea2587dfd620c3daaf7256ee0" ON "121-service"."intersolve_voucher" ("balanceUsed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e914753ffd9085b51c2d34f49c" ON "121-service"."intersolve_voucher" ("send") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2324fbeeaf2f98950c20b1d845" ON "121-service"."intersolve_voucher" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."imagecode_export_vouchers" ADD CONSTRAINT "FK_aef8b3f9b3e14b63f1f414e814d" FOREIGN KEY ("barcodeId") REFERENCES "121-service"."intersolve_voucher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
