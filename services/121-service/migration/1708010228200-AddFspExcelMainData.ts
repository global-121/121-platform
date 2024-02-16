import { MigrationInterface, QueryRunner } from "typeorm"

export class AddFspExcelMainData1708010228200 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(
        `INSERT INTO "121-service"."fsp" ("fsp", "fspDisplayNamePaApp", "integrationType", "fspDisplayNamePortal") VALUES ('Excel', '{ "en": "Excel Payment Instructions" }', 'csv', 'Excel Payment Instructions')`,
      );



    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(
        `DELETE FROM "121-service"."fsp" WHERE "fsp" = 'Excel'`,
      );
    }

}
