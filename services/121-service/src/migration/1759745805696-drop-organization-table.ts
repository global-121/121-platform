import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrganizationTable1759745805696 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'DropOrganizationTable1759745805696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."organization"`,
    );
  }
}
