import { MigrationInterface, QueryRunner } from "typeorm";

export class externalWalletUpdate1690469615632 implements MigrationInterface {
    name = 'externalWalletUpdate1690469615632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_wallet" ADD "lastExternalUpdate" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_wallet" DROP COLUMN "lastExternalUpdate"`);
    }

}
