import { MigrationInterface, QueryRunner } from 'typeorm';

export class RegistrationUniquePairs1733401228093
  implements MigrationInterface
{
  name = 'RegistrationUniquePairs1733401228093';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_unique_pairs" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationSmallerId" integer NOT NULL, "registrationLargerId" integer NOT NULL, CONSTRAINT "UQ_baca30bd87b6df409d332675954" UNIQUE ("registrationSmallerId", "registrationLargerId"), CONSTRAINT "PK_953444295386f708a5f10d4a2df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_093e666fd0931ed9dadbe3b81d" ON "121-service"."registration_unique_pairs" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_027ea55217d7fe593fba98fcd1" ON "121-service"."registration_unique_pairs" ("registrationSmallerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_835621467e670d1d4e51d7a850" ON "121-service"."registration_unique_pairs" ("registrationLargerId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_835621467e670d1d4e51d7a850"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_027ea55217d7fe593fba98fcd1"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_093e666fd0931ed9dadbe3b81d"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."registration_unique_pairs"`,
    );
    await queryRunner.query(
      `CREATE INDEX "registration_attribute_data_value_idx" ON "121-service"."registration_attribute_data" ("value") `,
    );
  }
}
