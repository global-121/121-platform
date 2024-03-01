import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexEventAttributeName1709277675778
  implements MigrationInterface
{
  name = 'IndexEventAttributeName1709277675778';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_d747a845fa0f0b4e682dd1994f" ON "121-service"."event_attribute" ("key") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d747a845fa0f0b4e682dd1994f"`,
    );
  }
}
