import {MigrationInterface, QueryRunner} from "typeorm";

export class rolesPermissions1642520954620 implements MigrationInterface {
    name = 'rolesPermissions1642520954620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "121-service"."permission" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2139f3b5ad8f7e095679fb50cf" ON "121-service"."permission" ("created") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_240853a0c3353c25fb12434ad3" ON "121-service"."permission" ("name") `);
        await queryRunner.query(`CREATE TABLE "121-service"."user_role_permissions_permission" ("userRoleId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_27a1de268ae064dab970c081609" PRIMARY KEY ("userRoleId", "permissionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_06012ed04be71b8bef3a3968ea" ON "121-service"."user_role_permissions_permission" ("userRoleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0ca2057b5085083ff9f18e3f9" ON "121-service"."user_role_permissions_permission" ("permissionId") `);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role" ADD CONSTRAINT "UQ_30ddd91a212a9d03669bc1dee74" UNIQUE ("role")`);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b"`);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role" DROP CONSTRAINT "UQ_30ddd91a212a9d03669bc1dee74"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_f0ca2057b5085083ff9f18e3f9"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_06012ed04be71b8bef3a3968ea"`);
        await queryRunner.query(`DROP TABLE "121-service"."user_role_permissions_permission"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_240853a0c3353c25fb12434ad3"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_2139f3b5ad8f7e095679fb50cf"`);
        await queryRunner.query(`DROP TABLE "121-service"."permission"`);
    }

}
