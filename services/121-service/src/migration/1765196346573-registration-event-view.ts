import { MigrationInterface, QueryRunner } from 'typeorm';

export class RegistrationEventView1765196346573 implements MigrationInterface {
  name = 'RegistrationEventView1765196346573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_event_view" AS SELECT "event"."id" AS "id", "event"."created" AS "created", "event"."updated" AS "updated", "event"."userId" AS "userId", "event"."type" AS "type", "registration"."id" AS "registrationId", "registration"."programId" AS "programId", "registration"."registrationProgramId" AS "registrationProgramId", "fieldNameAttr"."value" AS "fieldChanged", "oldValueAttr"."value" AS "oldValue", "newValueAttr"."value" AS "newValue", "reasonAttr"."value" AS "reason", "user"."username" AS "username" FROM "121-service"."registration_event" "event" LEFT JOIN "121-service"."registration" "registration" ON "registration"."id" = "event"."registrationId"  LEFT JOIN "121-service"."registration_event_attribute" "fieldNameAttr" ON "fieldNameAttr"."eventId" = "event"."id" AND "fieldNameAttr"."key" = 'fieldName'  LEFT JOIN "121-service"."registration_event_attribute" "oldValueAttr" ON "oldValueAttr"."eventId" = "event"."id" AND "oldValueAttr"."key" = 'oldValue'  LEFT JOIN "121-service"."registration_event_attribute" "newValueAttr" ON "newValueAttr"."eventId" = "event"."id" AND "newValueAttr"."key" = 'newValue'  LEFT JOIN "121-service"."registration_event_attribute" "reasonAttr" ON "reasonAttr"."eventId" = "event"."id" AND "reasonAttr"."key" = 'reason'  LEFT JOIN "121-service"."user" "user" ON "user"."id" = "event"."userId"`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_event_view',
        'SELECT "event"."id" AS "id", "event"."created" AS "created", "event"."updated" AS "updated", "event"."userId" AS "userId", "event"."type" AS "type", "registration"."id" AS "registrationId", "registration"."programId" AS "programId", "registration"."registrationProgramId" AS "registrationProgramId", "fieldNameAttr"."value" AS "fieldChanged", "oldValueAttr"."value" AS "oldValue", "newValueAttr"."value" AS "newValue", "reasonAttr"."value" AS "reason", "user"."username" AS "username" FROM "121-service"."registration_event" "event" LEFT JOIN "121-service"."registration" "registration" ON "registration"."id" = "event"."registrationId"  LEFT JOIN "121-service"."registration_event_attribute" "fieldNameAttr" ON "fieldNameAttr"."eventId" = "event"."id" AND "fieldNameAttr"."key" = \'fieldName\'  LEFT JOIN "121-service"."registration_event_attribute" "oldValueAttr" ON "oldValueAttr"."eventId" = "event"."id" AND "oldValueAttr"."key" = \'oldValue\'  LEFT JOIN "121-service"."registration_event_attribute" "newValueAttr" ON "newValueAttr"."eventId" = "event"."id" AND "newValueAttr"."key" = \'newValue\'  LEFT JOIN "121-service"."registration_event_attribute" "reasonAttr" ON "reasonAttr"."eventId" = "event"."id" AND "reasonAttr"."key" = \'reason\'  LEFT JOIN "121-service"."user" "user" ON "user"."id" = "event"."userId"',
      ],
    );

    // add fieldName: 'programFspConfigurationName' registrationEventAttribute for each fspChange registrationEvent
    await queryRunner.query(
      `INSERT INTO "121-service"."registration_event_attribute" ("eventId", "key", "value")
      SELECT
        id,
        'fieldName',
        'programFspConfigurationName'
      FROM "121-service"."registration_event"
      WHERE "type" = 'fspChange'`,
    );

    // add 3 attributes: oldValue, newValue, fieldName=duplicateStatus for each ignoredDuplicate registrationEvent
    await queryRunner.query(
      `INSERT INTO "121-service"."registration_event_attribute" ("eventId", "key", "value")
      SELECT
        id,
        'fieldName',
        'duplicateStatus'
      FROM "121-service"."registration_event"
      WHERE "type" = 'ignoredDuplicate'`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."registration_event_attribute" ("eventId", "key", "value")
      SELECT
        id,
        'oldValue',
        'duplicate'
      FROM "121-service"."registration_event"
      WHERE "type" = 'ignoredDuplicate'`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."registration_event_attribute" ("eventId", "key", "value")
      SELECT
        id,
        'newValue',
        'unique'
      FROM "121-service"."registration_event"
      WHERE "type" = 'ignoredDuplicate'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down
  }
}
