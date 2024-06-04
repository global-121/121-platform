import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAppPropsFromInstance1714636201547
  implements MigrationInterface
{
  name = 'RemoveAppPropsFromInstance1714636201547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance"
        DROP COLUMN "logoUrl",
        DROP COLUMN "dataPolicy",
        DROP COLUMN "contactDetails";`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD "contactDetails" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD "dataPolicy" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD "logoUrl" json`,
    );
  }
}
