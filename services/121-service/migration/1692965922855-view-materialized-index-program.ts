import { MigrationInterface, QueryRunner } from "typeorm";

export class ViewMaterializedIndexProgram1692965922855 implements MigrationInterface {
    name = 'ViewMaterializedIndexProgram1692965922855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_f9698ae072ce57177890bd00a6" ON "121-service"."registration_view_entity" ("programId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ed48bab55ecde6bda84479577" ON "121-service"."registration_view_entity" ("referenceId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_9ed48bab55ecde6bda84479577"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_f9698ae072ce57177890bd00a6"`);
    }

}
