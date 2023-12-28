import { MigrationInterface, QueryRunner } from "typeorm";

export class ProgramBudget1703776711447 implements MigrationInterface {
    name = 'ProgramBudget1703776711447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "budget" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "budget"`);
    }

}
