import { MigrationInterface, QueryRunner } from 'typeorm';

export class AirtelUserLookup1773951877357 implements MigrationInterface {
  name = 'AirtelUserLookup1773951877357';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."airtel_user_lookup" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "phoneNumberUsedForCall" character varying, "nameUsedForTheMatch" character varying, "isAirtelUser" boolean, "airtelName" character varying, "errorMessage" character varying, CONSTRAINT "REL_airtel_user_lookup_registrationId" UNIQUE ("registrationId"), CONSTRAINT "PK_airtel_user_lookup" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_airtel_user_lookup_created" ON "121-service"."airtel_user_lookup" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."airtel_user_lookup" ADD CONSTRAINT "FK_airtel_user_lookup_registrationId" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."airtel_user_lookup" DROP CONSTRAINT "FK_airtel_user_lookup_registrationId"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_airtel_user_lookup_created"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."airtel_user_lookup"`,
    );
  }
}
