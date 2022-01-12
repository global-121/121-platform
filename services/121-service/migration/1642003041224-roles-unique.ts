import {MigrationInterface, QueryRunner} from "typeorm";

export class rolesUnique1642003041224 implements MigrationInterface {
    name = 'rolesUnique1642003041224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."user_role" ADD CONSTRAINT "UQ_30ddd91a212a9d03669bc1dee74" UNIQUE ("role")`);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role_permissions_permission" ADD CONSTRAINT "FK_06012ed04be71b8bef3a3968ead" FOREIGN KEY ("userRoleId") REFERENCES "121-service"."user_role"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role_permissions_permission" ADD CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95" FOREIGN KEY ("permissionId") REFERENCES "121-service"."permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."user_role_permissions_permission" DROP CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95"`);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role_permissions_permission" DROP CONSTRAINT "FK_06012ed04be71b8bef3a3968ead"`);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role" DROP CONSTRAINT "UQ_30ddd91a212a9d03669bc1dee74"`);
    }

}
