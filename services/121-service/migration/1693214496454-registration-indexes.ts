import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationIndexes1693214496454 implements MigrationInterface {
    name = 'RegistrationIndexes1693214496454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_6105f577e2598f69703dc782da" ON "121-service"."registration_data" ("value") `);
        await queryRunner.query(`CREATE INDEX "IDX_f2257d31c7aabd2568ea3093ed" ON "121-service"."registration" ("registrationProgramId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_f2257d31c7aabd2568ea3093ed"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_6105f577e2598f69703dc782da"`);
    }

}
