import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueAssetIdKobo1771415645599 implements MigrationInterface {
  name = 'RemoveUniqueAssetIdKobo1771415645599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."kobo" DROP CONSTRAINT "UQ_528a1d991c04456ef4772c758e9"`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Never down');
  }
}
