import { MigrationInterface, QueryRunner } from 'typeorm';

export class Kobo1765989007478 implements MigrationInterface {
  name = 'Kobo1765989007478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."kobo" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "assetUid" character varying NOT NULL, "token" character varying NOT NULL, "versionId" character varying NOT NULL, "dateDeployed" date NOT NULL, "url" character varying NOT NULL, "programId" integer NOT NULL, CONSTRAINT "UQ_528a1d991c04456ef4772c758e9" UNIQUE ("assetUid"), CONSTRAINT "REL_cc59513480665889c53e46e7ee" UNIQUE ("programId"), CONSTRAINT "PK_4f6b295eb0aad65fc5f7657f928" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "editableInPortal" SET DEFAULT true`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Always keep moving forward!');
  }
}
