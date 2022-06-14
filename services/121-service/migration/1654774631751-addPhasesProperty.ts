import {MigrationInterface, QueryRunner} from "typeorm";

export class addPhasesProperty1654774631751 implements MigrationInterface {
    name = 'addPhasesProperty1654774631751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" ADD "phases" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_question" ADD "phases" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_custom_attribute" ADD "phases" json NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "phases"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_question" DROP COLUMN "phases"`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "phases"`);
    }

}
