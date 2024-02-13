import { MigrationInterface, QueryRunner } from 'typeorm';

export class Event1707835330251 implements MigrationInterface {
  name = 'Event1707835330251';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "type" character varying NOT NULL, "referenceKey" character varying NOT NULL, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b35693f96b1b13156954752023" ON "121-service"."event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8c3aeeac35ace9d387fb5e142" ON "121-service"."event" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1da3a2311543c09c5d055448b1" ON "121-service"."event" ("referenceKey") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."event_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "eventId" integer NOT NULL, "key" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "PK_47afd4881a9456d79bee41f4ee2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c7356500932acbd5f76a787ce" ON "121-service"."event_attribute" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" ADD CONSTRAINT "FK_01cd2b829e0263917bf570cb672" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" ADD CONSTRAINT "FK_9c065981c6e17cc1d076985fbba" FOREIGN KEY ("eventId") REFERENCES "121-service"."event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" DROP CONSTRAINT "FK_9c065981c6e17cc1d076985fbba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" DROP CONSTRAINT "FK_01cd2b829e0263917bf570cb672"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5c7356500932acbd5f76a787ce"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."event_attribute"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_1da3a2311543c09c5d055448b1"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b8c3aeeac35ace9d387fb5e142"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b35693f96b1b13156954752023"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."event"`);
  }
}
