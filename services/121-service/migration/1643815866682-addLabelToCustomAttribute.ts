import { MigrationInterface, QueryRunner } from 'typeorm';

export class addLabelToCustomAttribute1643815866682
  implements MigrationInterface {
  name = 'addLabelToCustomAttribute1643815866682';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "label" json NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "label"`,
    );
  }
}
