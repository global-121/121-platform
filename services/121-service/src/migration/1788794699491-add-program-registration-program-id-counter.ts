import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgramRegistrationProgramIdCounter1788794699491 implements MigrationInterface {
  name = 'AddProgramRegistrationProgramIdCounter1788794699491';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_registration_program_id_counter" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "lastRegistrationProgramId" integer NOT NULL DEFAULT 0, CONSTRAINT "REL_program_registration_program_id_counter_programId" UNIQUE ("programId"), CONSTRAINT "PK_program_registration_program_id_counter" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c3f6cb29531b666ef1759fed5" ON "121-service"."program_registration_program_id_counter" ("created")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_017d12e48ecd706400d3bb4554" ON "121-service"."program_registration_program_id_counter" ("programId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_program_id_counter" ADD CONSTRAINT "FK_017d12e48ecd706400d3bb45544" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."program_registration_program_id_counter" ("programId", "lastRegistrationProgramId")
       SELECT p.id, COALESCE(MAX(r."registrationProgramId"), 0)
       FROM "121-service"."program" p
       LEFT JOIN "121-service"."registration" r ON r."programId" = p.id
       GROUP BY p.id
       ON CONFLICT ("programId") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."program_registration_program_id_counter"`,
    );
  }
}
