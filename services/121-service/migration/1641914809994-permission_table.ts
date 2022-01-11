import {MigrationInterface, QueryRunner} from "typeorm";

export class permissionTable1641914809994 implements MigrationInterface {
    name = 'permissionTable1641914809994'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "121-service"."user_role_permissions_permission" ("userRoleId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_27a1de268ae064dab970c081609" PRIMARY KEY ("userRoleId", "permissionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_06012ed04be71b8bef3a3968ea" ON "121-service"."user_role_permissions_permission" ("userRoleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0ca2057b5085083ff9f18e3f9" ON "121-service"."user_role_permissions_permission" ("permissionId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_f0ca2057b5085083ff9f18e3f9"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_06012ed04be71b8bef3a3968ea"`);
        await queryRunner.query(`DROP TABLE "121-service"."user_role_permissions_permission"`);
    }

}
