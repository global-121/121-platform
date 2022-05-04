import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddValidationByQrProperty1637752825929
  implements MigrationInterface {
  name = 'AddValidationByQrProperty1637752825929';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "validationByQr" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "validationByQr"`,
    );
  }
}
