import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstanceToOrganization1717407847428 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "121-service"."instance"
            RENAME TO "organization"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "121-service"."organization"
            RENAME TO "instance"
        `);
  }
}
