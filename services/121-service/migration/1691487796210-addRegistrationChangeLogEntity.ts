import { MigrationInterface, QueryRunner } from 'typeorm';

export class addRegistrationChangeLogEntity1691487796210
  implements MigrationInterface
{
  name = 'addRegistrationChangeLogEntity1691487796210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_change_log" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "userId" integer NOT NULL, "fieldName" character varying NOT NULL, "oldValue" character varying, "newValue" character varying, "reason" character varying, CONSTRAINT "PK_e8a6a5c118446b2c3ab9ad0d83e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97c91ab6f7ac8ac92d6f348b0c" ON "121-service"."registration_change_log" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_change_log" ADD CONSTRAINT "FK_2e38d05de96d35959249c8e3b7b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_change_log" ADD CONSTRAINT "FK_dcc3d0622abbe0f6c2ccf15cda4" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_change_log" DROP CONSTRAINT "FK_dcc3d0622abbe0f6c2ccf15cda4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_change_log" DROP CONSTRAINT "FK_2e38d05de96d35959249c8e3b7b"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_97c91ab6f7ac8ac92d6f348b0c"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."registration_change_log"`,
    );
  }
}
