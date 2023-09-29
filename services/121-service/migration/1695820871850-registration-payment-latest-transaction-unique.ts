import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationPaymentLatestTransactionUnique1695820871850 implements MigrationInterface {
    name = 'RegistrationPaymentLatestTransactionUnique1695820871850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_63f749fc7f7178ae1ad85d3b95" ON "121-service"."transaction" ("status") `);
        await queryRunner.query(`ALTER TABLE "121-service"."latest_transaction" ADD CONSTRAINT "registrationPaymentLatestTransactionUnique" UNIQUE ("registrationId", "payment")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."latest_transaction" DROP CONSTRAINT "registrationPaymentLatestTransactionUnique"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_63f749fc7f7178ae1ad85d3b95"`);
    }

}
