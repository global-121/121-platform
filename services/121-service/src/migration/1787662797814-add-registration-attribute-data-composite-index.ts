import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationAttributeDataCompositeIndex1787662797814 implements MigrationInterface {
  name = 'AddRegistrationAttributeDataCompositeIndex1787662797814';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // On production, build this index manually with CREATE INDEX CONCURRENTLY beforehand to
    // avoid locking writes; IF NOT EXISTS then makes this migration a no-op there while still
    // provisioning dev/test/CI environments.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_registration_attribute_data_attributeId_value" ON "121-service"."registration_attribute_data" ("programRegistrationAttributeId", "value")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "121-service"."IDX_registration_attribute_data_attributeId_value"`,
    );
  }
}
