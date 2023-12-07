import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeEspo1694528718252 implements MigrationInterface {
  name = 'removeEspo1694528718252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ba7bc54b14f9fbbf71b35c56de"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."espocrm_webhook"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."espocrm_webhook" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "referenceId" character varying NOT NULL, "actionType" character varying NOT NULL, "entityType" character varying NOT NULL, "secretKey" character varying NOT NULL, CONSTRAINT "PK_24322e389a61ca12a98ff18a6ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba7bc54b14f9fbbf71b35c56de" ON "121-service"."espocrm_webhook" ("created") `,
    );
  }
}
