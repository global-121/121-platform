import { MigrationInterface, QueryRunner } from 'typeorm';

export class Attachments1751615833393 implements MigrationInterface {
  name = 'Attachments1751615833393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_attachment" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "fileName" character varying NOT NULL, "mimeType" character varying NOT NULL, "blobName" character varying NOT NULL, CONSTRAINT "PK_4bf5004c9d352fc445054bbbb96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e4dc23fd76ea29bc85459e775" ON "121-service"."program_attachment" ("created") `,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('We only move forward, never backward!');
  }
}
