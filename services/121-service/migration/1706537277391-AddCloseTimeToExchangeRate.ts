import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCloseTimeToExchangeRate1706537277391 implements MigrationInterface {
    name = 'AddCloseTimeToExchangeRate1706537277391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."exchange-rate" ADD "closeTime" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."exchange-rate" DROP COLUMN "closeTime"`);
    }

}
