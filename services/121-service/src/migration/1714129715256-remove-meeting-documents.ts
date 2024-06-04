import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMeetingDocuments1714129715256 implements MigrationInterface {
  name = 'RemoveMeetingDocuments1714129715256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "meetingDocuments"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "meetingDocuments" json`,
    );
  }
}
