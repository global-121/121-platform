import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeMigrateNamePartnerOrg1643720490970 implements MigrationInterface {
  name = 'removeMigrateNamePartnerOrg1643720490970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();
    await queryRunner.startTransaction();
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "namePartnerOrganization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "FK_73c4bbddef1ccb565239e250b59" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "FK_73c4bbddef1ccb565239e250b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "namePartnerOrganization" character varying`,
    );
  }
}
