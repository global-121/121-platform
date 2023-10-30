import { MigrationInterface, QueryRunner } from 'typeorm';

export class noteEntity1697528704118 implements MigrationInterface {
  name = 'noteEntity1697528704118';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."note" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "userId" integer NOT NULL, "text" character varying NOT NULL, CONSTRAINT "PK_96d0c172a4fba276b1bbed43058" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ebd19a873c96a66454b89bb3e7" ON "121-service"."note" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" ADD CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" ADD CONSTRAINT "FK_5b87d9d19127bd5d92026017a7b" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`INSERT INTO "121-service"."note" (created, updated, "registrationId", "userId", "text")
      SELECT reg."noteUpdated", reg."noteUpdated", reg."id", (SELECT id
      FROM "121-service"."user" WHERE username = 'admin@example.org'
      ), reg.note
        FROM "121-service"."registration" reg
        WHERE reg.note IS NOT NULL; `);
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "noteUpdated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "note"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" DROP CONSTRAINT "FK_5b87d9d19127bd5d92026017a7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."note" DROP CONSTRAINT "FK_a341b2f46655af6d3d8356f2b4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "note" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "noteUpdated" TIMESTAMP`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ebd19a873c96a66454b89bb3e7"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."note"`);
  }
}
