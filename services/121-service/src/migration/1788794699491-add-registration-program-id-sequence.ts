import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationProgramIdSequence1788794699491 implements MigrationInterface {
  name = 'AddRegistrationProgramIdSequence1788794699491';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_program_id_sequence" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "lastRegistrationProgramId" integer NOT NULL DEFAULT 0, CONSTRAINT "REL_54d081093ded7d2c18edc12a9e" UNIQUE ("programId"), CONSTRAINT "PK_c40e09311eff68560ab8c66af7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72ad75c8a26716daea2766a6df" ON "121-service"."registration_program_id_sequence" ("created")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_54d081093ded7d2c18edc12a9e" ON "121-service"."registration_program_id_sequence" ("programId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_program_id_sequence" ADD CONSTRAINT "FK_54d081093ded7d2c18edc12a9e9" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."registration_program_id_sequence" ("programId", "lastRegistrationProgramId")
       SELECT p.id, COALESCE(MAX(r."registrationProgramId"), 0)
       FROM "121-service"."program" p
       LEFT JOIN "121-service"."registration" r ON r."programId" = p.id
       GROUP BY p.id
       ON CONFLICT ("programId") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."registration_program_id_sequence"`,
    );
  }
}
