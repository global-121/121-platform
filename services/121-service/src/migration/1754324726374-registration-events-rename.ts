import { MigrationInterface, QueryRunner } from 'typeorm';

export class RegistrationEventsRename1754324726374 implements MigrationInterface {
  name = 'RegistrationEventsRename1754324726374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" DROP CONSTRAINT "FK_497c4072a86797298c1c0cf776c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" DROP CONSTRAINT "FK_01cd2b829e0263917bf570cb672"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" DROP CONSTRAINT "FK_9c065981c6e17cc1d076985fbba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" RENAME TO "registration_event_attribute"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" RENAME TO "registration_event"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_437744e5c3fbb1a8ced09d3280" ON "121-service"."registration_event_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92417754d91c93030e21bf1e56" ON "121-service"."registration_event_attribute" ("key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d26769b88ceaf61d06fe7b6124" ON "121-service"."registration_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_289b5cc5aa97009f16f5a426df" ON "121-service"."registration_event" ("type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event_attribute" ADD CONSTRAINT "FK_8b3f63ab7e5d143a31caf18cbd8" FOREIGN KEY ("eventId") REFERENCES "121-service"."registration_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event" ADD CONSTRAINT "FK_5d4a07c68647c106a4c3835e060" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event" ADD CONSTRAINT "FK_ba196730ca0ca8fba27a9e600a1" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5c7356500932acbd5f76a787ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d747a845fa0f0b4e682dd1994f"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b35693f96b1b13156954752023"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b8c3aeeac35ace9d387fb5e142"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."registration_event_attribute_id_seq" OWNED BY "121-service"."registration_event_attribute"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event_attribute" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."registration_event_attribute_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event_attribute" DROP CONSTRAINT "FK_8b3f63ab7e5d143a31caf18cbd8"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."registration_event_id_seq" OWNED BY "121-service"."registration_event"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."registration_event_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_event_attribute" ADD CONSTRAINT "FK_8b3f63ab7e5d143a31caf18cbd8" FOREIGN KEY ("eventId") REFERENCES "121-service"."registration_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `SELECT setval('121-service.registration_event_id_seq', (SELECT MAX(id) FROM "121-service"."registration_event")+ 1)`,
    );
    await queryRunner.query(
      `SELECT setval('121-service.registration_event_attribute_id_seq', (SELECT MAX(id) FROM "121-service"."registration_event_attribute")+ 1)`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('We only move forward and never look back!');
  }
}
