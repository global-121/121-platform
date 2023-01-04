import {MigrationInterface, QueryRunner} from "typeorm";

export class addContenttypeToTwilioMessage1672829862684 implements MigrationInterface {
    name = 'addContenttypeToTwilioMessage1672829862684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "121-service"."twilio_message_contenttype_enum" AS ENUM('registered', 'invitation', 'included', 'inclusion-ended', 'rejected', 'invited', 'custom', 'generic-templated', 'payment-templated')`);
        await queryRunner.query(`ALTER TABLE "121-service"."twilio_message" ADD "contentType" "121-service"."twilio_message_contenttype_enum" NOT NULL DEFAULT 'custom'`);
        await queryRunner.query(`CREATE TYPE "121-service"."whatsapp_pending_message_contenttype_enum" AS ENUM('registered', 'invitation', 'included', 'inclusion-ended', 'rejected', 'invited', 'custom', 'generic-templated', 'payment-templated')`);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" ADD "contentType" "121-service"."whatsapp_pending_message_contenttype_enum" NOT NULL DEFAULT 'custom'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" DROP COLUMN "contentType"`);
        await queryRunner.query(`DROP TYPE "121-service"."whatsapp_pending_message_contenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "121-service"."twilio_message" DROP COLUMN "contentType"`);
        await queryRunner.query(`DROP TYPE "121-service"."twilio_message_contenttype_enum"`);
    }

}
