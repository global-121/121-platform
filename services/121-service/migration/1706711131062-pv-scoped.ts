import { MigrationInterface, QueryRunner } from 'typeorm';

export class PvScoped1706711131062 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const instances = await queryRunner.query(`
      select
        id
      from
        "121-service"."instance"
      where
        name = 'NLRC';`);
    if (instances.length > 0) {
      await queryRunner.query(`
          update "121-service"."program"
          set "enableScope" = true
          where "id" = 2;
        `);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
