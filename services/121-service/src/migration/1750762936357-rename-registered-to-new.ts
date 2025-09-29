import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRegisteredToNew1750762936357 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // update registration.registrationStatus
    await queryRunner.query(
      `UPDATE "121-service".registration
        SET "registrationStatus" = 'new'
        WHERE "registrationStatus" = 'registered';`,
    );

    // update event_attribute, but only for oldValue or newValue of registrationStatusChange events
    await queryRunner.query(
      `UPDATE "121-service".event_attribute ea
        SET value = 'new'
        FROM "121-service".event e
        WHERE ea.value = 'registered'
        AND ea."key" IN ('oldValue', 'newValue')
        AND ea."eventId" = e.id
        AND e."type" = 'registrationStatusChange';`,
    );

    // update contentType.registered to contentType.custom as registered is now deprecated
    await queryRunner.query(
      `UPDATE "121-service".twilio_message
        SET "contentType" = 'custom'
        WHERE "contentType" = 'registered';`,
    );
    await queryRunner.query(
      `UPDATE "121-service".whatsapp_pending_message
        SET "contentType" = 'custom'
        WHERE "contentType" = 'registered';`,
    );

    // delete message_template records with type registered and isSendMessageTemplate = false (which in practice is all 'type=registered' records), as those are no longer used
    await queryRunner.query(
      `DELETE FROM "121-service".message_template
        WHERE "type" = 'registered' AND "isSendMessageTemplate" = false;`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // We agreed not to implement the down migration for these kind of database migrations
  }
}
