import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstanceToOrganization1717407847428 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE "121-service"."instance"
    RENAME TO "organization"
`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f5e1732821ebe099cf8cb627ab"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."organization_id_seq" OWNED BY "121-service"."organization"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."organization" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."organization_id_seq"')`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_250b754e2e003ae16d59f39b78" ON "121-service"."organization" ("created") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "121-service"."organization"
            RENAME TO "instance"
        `);
  }
}
