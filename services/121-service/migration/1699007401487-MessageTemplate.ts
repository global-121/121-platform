import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageTemplate1699007401487 implements MigrationInterface {
    name = 'MessageTemplate1699007401487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "121-service"."message_template" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "type" character varying NOT NULL, "language" character varying NOT NULL, "message" character varying NOT NULL, "isWhatsappTemplate" boolean NOT NULL, CONSTRAINT "PK_616800da109c721fb4dd2019a9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_927cc52d451d253f66fcc9d659" ON "121-service"."message_template" ("created") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_927cc52d451d253f66fcc9d659"`);
        await queryRunner.query(`DROP TABLE "121-service"."message_template"`);
    }

}
