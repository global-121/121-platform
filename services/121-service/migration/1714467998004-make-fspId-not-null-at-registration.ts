import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeFspIdNotNullAtRegistration1714467998004
  implements MigrationInterface
{
  name = 'MakeFspIdNotNullAtRegistration1714467998004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "fspId" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "fspId" DROP NOT NULL`,
    );
  }
}
