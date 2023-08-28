import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationDataIndex1693222215702 implements MigrationInterface {
    name = 'RegistrationDataIndex1693222215702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_65982d6021412781740a70c895" ON "121-service"."registration_data" ("registrationId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_65982d6021412781740a70c895"`);
    }

}
