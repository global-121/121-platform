import {MigrationInterface, QueryRunner} from "typeorm";

export class permission1641912138249 implements MigrationInterface {
    name = 'permission1641912138249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "121-service"."permission" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2139f3b5ad8f7e095679fb50cf" ON "121-service"."permission" ("created") `);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_2139f3b5ad8f7e095679fb50cf"`);
        await queryRunner.query(`DROP TABLE "121-service"."permission"`);
    }

}
