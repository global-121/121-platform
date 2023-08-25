import { MigrationInterface, QueryRunner } from "typeorm";

export class ViewMaterializedIndex1692964887924 implements MigrationInterface {
    name = 'ViewMaterializedIndex1692964887924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_4b4bcc43cb3c34d1810b921867" ON "121-service"."registration_view_entity" ("id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_4b4bcc43cb3c34d1810b921867"`);
    }

}
