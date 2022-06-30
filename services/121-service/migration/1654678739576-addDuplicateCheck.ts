import {MigrationInterface, QueryRunner} from "typeorm";

export class addDuplicateCheck1654678739576 implements MigrationInterface {
    name = 'addDuplicateCheck1654678739576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" ADD "duplicateCheck" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_question" ADD "duplicateCheck" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program_question" DROP COLUMN "duplicateCheck"`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "duplicateCheck"`);
    }

}
