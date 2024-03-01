import { MigrationInterface, QueryRunner } from 'typeorm';

export class Readonlyuser1709300672260 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const doesReadonlyuserExist = await queryRunner.query(
      `SELECT * FROM pg_roles WHERE rolname='readonlyuser'`,
    );
    if (doesReadonlyuserExist.length) {
      await queryRunner.query(
        `GRANT SELECT ON all tables in schema "121-service" TO readonlyuser;`,
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
