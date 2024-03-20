import { MigrationInterface, QueryRunner } from 'typeorm';

export class IsEntraUserBoolean1710319349965 implements MigrationInterface {
  name = 'IsEntraUserBoolean1710319349965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" ADD "isEntraUser" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user" DROP COLUMN "isEntraUser"`,
    );
  }
}
