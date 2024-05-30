import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePersonAffectedAppData1714485575484
  implements MigrationInterface
{
  name = 'RemovePersonAffectedAppData1714485575484';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."people_affected_app_data" DROP CONSTRAINT "FK_578c6c920a1b5e7c87a7148eb49"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_9ffa6705e8ed7f9a5e9ac10779"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ca668ee3e45d5433abf3029044"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."people_affected_app_data"`,
    );
  }

  public async down(): Promise<void> {
    // Down migration not implemented
  }
}
