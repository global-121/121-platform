import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramFspConfigMissingSequence1750777175366 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `select
        setval(
        '"121-service".program_fsp_configuration_property_id_seq',
        (
        select
          MAX(id) + 1
        from
          "121-service".program_fsp_configuration_property pfcp )
      );
      `,
    );
    await queryRunner.query(
      `select
        setval(
        '"121-service".program_fsp_configuration_id_seq',
        (
        select
          MAX(id) + 1
        from
          "121-service".program_fsp_configuration pfc )
      );`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('We only move forward, there is no going back!');
  }
}
