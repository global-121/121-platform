import {MigrationInterface, QueryRunner} from "typeorm";

export class installmentToPayment1634137432911 implements MigrationInterface {
    name = 'installmentToPayment1634137432911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" RENAME COLUMN "installment" TO "payment"`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_barcode" RENAME COLUMN "installment" TO "payment"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_barcode" RENAME COLUMN "payment" TO "installment"`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" RENAME COLUMN "payment" TO "installment"`);
    }

}
