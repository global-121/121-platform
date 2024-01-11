import { MigrationInterface, QueryRunner } from "typeorm";

export class ProgramNewProperty1704960560245 implements MigrationInterface {
    name = 'ProgramNewProperty1704960560245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" ADD "allowEmptyPhoneNumber" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program" DROP COLUMN "allowEmptyPhoneNumber"`);
    }

}
