import {MigrationInterface, QueryRunner} from "typeorm";

export class addUpdatedColumnToBaseEntity1667913063438 implements MigrationInterface {
    name = 'addUpdatedColumnToBaseEntity1667913063438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."permission" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."people_affected_app_data" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."user" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."action" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_custom_attribute" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."monitoring_question" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."instance" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."twilio_message" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."try_whatsapp" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_barcode" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."imagecode_export_vouchers" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_status_change" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_template_test" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."imagecode" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_instruction" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_instruction" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."at_notification" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."imagecode" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_template_test" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_status_change" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."whatsapp_pending_message" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."imagecode_export_vouchers" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."try_whatsapp" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."twilio_message" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."instance" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."monitoring_question" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."action" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."user" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."people_affected_app_data" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."user_role" DROP COLUMN "updated"`);
        await queryRunner.query(`ALTER TABLE "121-service"."permission" DROP COLUMN "updated"`);
    }

}
