import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReferenceIdNotStatus1696326972438 implements MigrationInterface {
  name = 'ReferenceIdNotStatus1696326972438';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "CHK_8a7f003624256c9557f4971425" CHECK ("referenceId" NOT IN ('status'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "CHK_8a7f003624256c9557f4971425"`,
    );
  }
}
