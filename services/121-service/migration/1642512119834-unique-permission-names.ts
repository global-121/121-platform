import {MigrationInterface, QueryRunner} from "typeorm";

export class uniquePermissionNames1642512119834 implements MigrationInterface {
    name = 'uniquePermissionNames1642512119834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_240853a0c3353c25fb12434ad3" ON "121-service"."permission" ("name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_240853a0c3353c25fb12434ad3"`);
    }

}
