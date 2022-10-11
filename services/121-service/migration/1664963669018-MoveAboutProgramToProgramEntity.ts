import {MigrationInterface, QueryRunner} from "typeorm";

export class MoveAboutProgramToProgramEntity1664963669018 implements MigrationInterface {
    name = 'MoveAboutProgramToProgramEntity1664963669018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."instance" DROP COLUMN "aboutProgram"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "aboutProgram" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "aboutProgram"`);
        await queryRunner.query(`ALTER TABLE "121-service"."instance" ADD "aboutProgram" json`);
    }

}
