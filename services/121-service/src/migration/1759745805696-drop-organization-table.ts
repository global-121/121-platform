import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrganizationTable1759745805696 implements MigrationInterface {
  name = 'DropOrganizationTable1759745805696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."organization"`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('We only move forward and never look back!');
  }
}
