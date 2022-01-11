import {MigrationInterface, QueryRunner} from "typeorm";

export class permissions1641905817841 implements MigrationInterface {
    name = 'permissions1641905817841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "121-service"."permissions" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "permission" character varying NOT NULL, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_29cc0e3d0e49d0124f2f8dfbb7" ON "121-service"."permissions" ("created") `);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_29cc0e3d0e49d0124f2f8dfbb7"`);
        await queryRunner.query(`DROP TABLE "121-service"."permissions"`);
    }

}
