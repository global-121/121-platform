import { MigrationInterface, QueryRunner } from 'typeorm';

export class RegistrationEventView1764064767555 implements MigrationInterface {
  name = 'RegistrationEventView1764064767555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE VIEW "121-service"."registration_event_view" AS SELECT "event"."id" AS "id", "event"."created" AS "created", "event"."updated" AS "updated", "event"."userId" AS "userId", "registration"."id" AS "registrationId", "registration"."programId" AS "programId", "registration"."registrationProgramId" AS "registrationProgramId", "reasonAttr"."value" AS "reason", "user"."username" AS "username",
        CASE
          WHEN "event"."type" = 'registrationStatusChange' THEN 'Status'
          WHEN "event"."type" = 'registrationDataChange' THEN "fieldNameAttr"."value"
          WHEN "event"."type" = 'fspChange' THEN 'FSP'
          WHEN "event"."type" = 'ignoredDuplicate' THEN 'duplicateStatus'
          ELSE NULL
        END
       AS "fieldChanged", CASE WHEN "event"."type" = 'ignoredDuplicate' THEN 'duplicate' ELSE "oldValueAttr"."value" END AS "oldValue", CASE WHEN "event"."type" = 'ignoredDuplicate' THEN 'unique' ELSE "newValueAttr"."value" END AS "newValue" FROM "121-service"."registration_event" "event" LEFT JOIN "121-service"."registration" "registration" ON "registration"."id" = "event"."registrationId"  LEFT JOIN "121-service"."registration_event_attribute" "fieldNameAttr" ON "fieldNameAttr"."eventId" = "event"."id" AND "fieldNameAttr"."key" = 'fieldName'  LEFT JOIN "121-service"."registration_event_attribute" "oldValueAttr" ON "oldValueAttr"."eventId" = "event"."id" AND "oldValueAttr"."key" = 'oldValue'  LEFT JOIN "121-service"."registration_event_attribute" "newValueAttr" ON "newValueAttr"."eventId" = "event"."id" AND "newValueAttr"."key" = 'newValue'  LEFT JOIN "121-service"."registration_event_attribute" "reasonAttr" ON "reasonAttr"."eventId" = "event"."id" AND "reasonAttr"."key" = 'reason'  LEFT JOIN "121-service"."user" "user" ON "user"."id" = "event"."userId"`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_event_view',
        'SELECT "event"."id" AS "id", "event"."created" AS "created", "event"."updated" AS "updated", "event"."userId" AS "userId", "registration"."id" AS "registrationId", "registration"."programId" AS "programId", "registration"."registrationProgramId" AS "registrationProgramId", "reasonAttr"."value" AS "reason", "user"."username" AS "username", \n        CASE\n          WHEN "event"."type" = \'registrationStatusChange\' THEN \'Status\'\n          WHEN "event"."type" = \'registrationDataChange\' THEN "fieldNameAttr"."value"\n          WHEN "event"."type" = \'fspChange\' THEN \'FSP\'\n          WHEN "event"."type" = \'ignoredDuplicate\' THEN \'duplicateStatus\'\n          ELSE NULL\n        END\n       AS "fieldChanged", CASE WHEN "event"."type" = \'ignoredDuplicate\' THEN \'duplicate\' ELSE "oldValueAttr"."value" END AS "oldValue", CASE WHEN "event"."type" = \'ignoredDuplicate\' THEN \'unique\' ELSE "newValueAttr"."value" END AS "newValue" FROM "121-service"."registration_event" "event" LEFT JOIN "121-service"."registration" "registration" ON "registration"."id" = "event"."registrationId"  LEFT JOIN "121-service"."registration_event_attribute" "fieldNameAttr" ON "fieldNameAttr"."eventId" = "event"."id" AND "fieldNameAttr"."key" = \'fieldName\'  LEFT JOIN "121-service"."registration_event_attribute" "oldValueAttr" ON "oldValueAttr"."eventId" = "event"."id" AND "oldValueAttr"."key" = \'oldValue\'  LEFT JOIN "121-service"."registration_event_attribute" "newValueAttr" ON "newValueAttr"."eventId" = "event"."id" AND "newValueAttr"."key" = \'newValue\'  LEFT JOIN "121-service"."registration_event_attribute" "reasonAttr" ON "reasonAttr"."eventId" = "event"."id" AND "reasonAttr"."key" = \'reason\'  LEFT JOIN "121-service"."user" "user" ON "user"."id" = "event"."userId"',
      ],
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down
  }
}
