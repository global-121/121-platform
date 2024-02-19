import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventEntity1708330964000 implements MigrationInterface {
  name = 'EventEntity1708330964000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."event_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "eventId" integer NOT NULL, "key" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_47afd4881a9456d79bee41f4ee2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c7356500932acbd5f76a787ce" ON "121-service"."event_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "type" character varying NOT NULL, "registrationId" integer NOT NULL, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b35693f96b1b13156954752023" ON "121-service"."event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8c3aeeac35ace9d387fb5e142" ON "121-service"."event" ("type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event_attribute" ADD CONSTRAINT "FK_9c065981c6e17cc1d076985fbba" FOREIGN KEY ("eventId") REFERENCES "121-service"."event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" ADD CONSTRAINT "FK_01cd2b829e0263917bf570cb672" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."event" ADD CONSTRAINT "FK_497c4072a86797298c1c0cf776c" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `DROP INDEX "121-service"."IDX_b8c3aeeac35ace9d387fb5e142"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b35693f96b1b13156954752023"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."event"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5c7356500932acbd5f76a787ce"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."event_attribute"`);
  }
}
