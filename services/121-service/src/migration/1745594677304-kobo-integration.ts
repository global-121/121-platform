import { MigrationInterface, QueryRunner } from 'typeorm';

export class KoboIntegration1745594677304 implements MigrationInterface {
  name = 'KoboIntegration1745594677304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."kobo" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "assetId" character varying NOT NULL, "tokenCode" character varying NOT NULL, "versionId" character varying NOT NULL, "dateDeployed" date NOT NULL, "programId" integer NOT NULL, CONSTRAINT "UQ_528a1d991c04456ef4772c758e9" UNIQUE ("assetId"), CONSTRAINT "REL_cc59513480665889c53e46e7ee" UNIQUE ("programId"), CONSTRAINT "PK_4f6b295eb0aad65fc5f7657f928" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9fa2e5423311938a6c79bc422d" ON "121-service"."kobo" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc59513480665889c53e46e7ee" ON "121-service"."kobo" ("programId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" ADD CONSTRAINT "FK_cc59513480665889c53e46e7eed" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" DROP CONSTRAINT "FK_cc59513480665889c53e46e7eed"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_cc59513480665889c53e46e7ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9fa2e5423311938a6c79bc422d"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."kobo"`);
  }
}
