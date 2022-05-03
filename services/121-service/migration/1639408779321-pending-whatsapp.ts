import {MigrationInterface, QueryRunner} from "typeorm";

export class pendingWhatsapp1639408779321 implements MigrationInterface {
    name = 'pendingWhatsapp1639408779321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "121-service"."whatsapp_pending_message" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "body" character varying NOT NULL, "mediaUrl" character varying, "messageType" character varying, "to" character varying NOT NULL, "registrationId" integer, CONSTRAINT "PK_8d5995c5682dc28138b9cd770b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5f3cc35461fa4c60341bba9f9b" ON "121-service"."whatsapp_pending_message" ("created") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_5f3cc35461fa4c60341bba9f9b"`);
        await queryRunner.query(`DROP TABLE "121-service"."whatsapp_pending_message"`);
    }

}
