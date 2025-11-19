import { MigrationInterface, QueryRunner } from 'typeorm';

export class RegistrationEventView1763540205044 implements MigrationInterface {
  name = 'RegistrationEventView1763540205044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE VIEW "121-service"."registration_event_view" AS SELECT "event"."id" AS "id", "event"."created" AS "created", "event"."updated" AS "updated", "event"."userId" AS "userId", "registration"."programId" AS "programId", "registration"."registrationProgramId" AS "registrationProgramId",
        CASE
          WHEN "event"."type" = 'registrationStatusChange' THEN 'Status'
          WHEN "event"."type" = 'registrationDataChange' THEN attributes."fieldName"
          WHEN "event"."type" = 'fspChange' THEN 'FSP'
          ELSE NULL
        END
       AS "fieldChanged", attributes."oldValue" AS "oldValue", attributes."newValue" AS "newValue", attributes."reason" AS "reason" FROM "121-service"."registration_event" "event" LEFT JOIN (SELECT "attr"."eventId" AS "eventId", MAX(CASE WHEN "attr"."key" = 'fieldName' THEN "attr"."value" END) AS "fieldName", MAX(CASE WHEN "attr"."key" = 'oldValue' THEN "attr"."value" END) AS "oldValue", MAX(CASE WHEN "attr"."key" = 'newValue' THEN "attr"."value" END) AS "newValue", MAX(CASE WHEN "attr"."key" = 'reason' THEN "attr"."value" END) AS "reason" FROM "121-service"."registration_event_attribute" "attr" GROUP BY "attr"."eventId") "attributes" ON attributes."eventId" = "event"."id"  LEFT JOIN "121-service"."registration" "registration" ON "registration"."id" = "event"."registrationId" WHERE "event"."type" != 'ignoredDuplicate'`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_event_view',
        'SELECT "event"."id" AS "id", "event"."created" AS "created", "event"."updated" AS "updated", "event"."userId" AS "userId", "registration"."programId" AS "programId", "registration"."registrationProgramId" AS "registrationProgramId", \n        CASE\n          WHEN "event"."type" = \'registrationStatusChange\' THEN \'Status\'\n          WHEN "event"."type" = \'registrationDataChange\' THEN attributes."fieldName"\n          WHEN "event"."type" = \'fspChange\' THEN \'FSP\'\n          ELSE NULL\n        END\n       AS "fieldChanged", attributes."oldValue" AS "oldValue", attributes."newValue" AS "newValue", attributes."reason" AS "reason" FROM "121-service"."registration_event" "event" LEFT JOIN (SELECT "attr"."eventId" AS "eventId", MAX(CASE WHEN "attr"."key" = \'fieldName\' THEN "attr"."value" END) AS "fieldName", MAX(CASE WHEN "attr"."key" = \'oldValue\' THEN "attr"."value" END) AS "oldValue", MAX(CASE WHEN "attr"."key" = \'newValue\' THEN "attr"."value" END) AS "newValue", MAX(CASE WHEN "attr"."key" = \'reason\' THEN "attr"."value" END) AS "reason" FROM "121-service"."registration_event_attribute" "attr" GROUP BY "attr"."eventId") "attributes" ON attributes."eventId" = "event"."id"  LEFT JOIN "121-service"."registration" "registration" ON "registration"."id" = "event"."registrationId" WHERE "event"."type" != \'ignoredDuplicate\'',
      ],
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down migration,
  }
}
