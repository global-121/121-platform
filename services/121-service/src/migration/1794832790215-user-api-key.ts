import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserApiKey1794832790215 implements MigrationInterface {
  name = 'UserApiKey1794832790215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."user_api_key" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "apiKey" character varying NOT NULL, CONSTRAINT "REL_c6316cc59f67b45ed31310bce5" UNIQUE ("userId"), CONSTRAINT "PK_9180f9a158e8cda6864358cd462" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd8ffd3827f21d2c8ae1e37ee4" ON "121-service"."user_api_key" ("created") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_92ab922ee0d04d90699f1f3a93" ON "121-service"."user_api_key" ("apiKey") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_api_key" ADD CONSTRAINT "FK_c6316cc59f67b45ed31310bce53" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
