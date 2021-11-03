import {MigrationInterface, QueryRunner} from "typeorm";

export class fspIntegrationType1635859811891 implements MigrationInterface {
    name = 'fspIntegrationType1635859811891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."fsp" ADD "integrationType" character varying NOT NULL DEFAULT 'api'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."fsp" DROP COLUMN "integrationType"`);
    }

}
