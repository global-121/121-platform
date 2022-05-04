import { MigrationInterface, QueryRunner } from 'typeorm';

export class addDeprecatedCustomDataKeys1650985550134
  implements MigrationInterface {
  name = 'addDeprecatedCustomDataKeys1650985550134';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "deprecatedCustomDataKeys" json NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "deprecatedCustomDataKeys"`,
    );
  }
}
