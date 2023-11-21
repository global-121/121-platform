import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageTemplate1699276319254 implements MigrationInterface {
    name = 'MessageTemplate1699276319254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "121-service"."message_template" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "language" character varying NOT NULL, "message" character varying NOT NULL, "isWhatsappTemplate" boolean NOT NULL, "programId" integer NOT NULL, CONSTRAINT "PK_616800da109c721fb4dd2019a9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_927cc52d451d253f66fcc9d659" ON "121-service"."message_template" ("created") `);
        await queryRunner.query(`ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_927cc52d451d253f66fcc9d659"`);
        await queryRunner.query(`DROP TABLE "121-service"."message_template"`);
    }

}
