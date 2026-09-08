import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramFspConfigMissingSequence1750777175366 implements Omit<
  MigrationInterface,
  'down'
> {
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
}
