import {MigrationInterface, QueryRunner} from "typeorm";

export class SplitProgramTitleHoPa1636548038762 implements MigrationInterface {
    name = 'SplitProgramTitleHoPa1636548038762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "descLocation"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "descHumanitarianObjective"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "titlePortal" json`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "titlePaApp" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "titlePaApp"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "titlePortal"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "descHumanitarianObjective" json`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "descLocation" json`);
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "title" json`);
    }

}
