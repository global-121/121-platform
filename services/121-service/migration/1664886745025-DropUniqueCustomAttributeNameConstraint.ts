import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUniqueCustomAttributeNameConstraint1664886745025
  implements MigrationInterface {
  name = 'DropUniqueCustomAttributeNameConstraint1664886745025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_40dd226b99324147dd82c9d50a"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_40dd226b99324147dd82c9d50a" ON "121-service"."program_custom_attribute" ("name") `,
    );
  }
}
