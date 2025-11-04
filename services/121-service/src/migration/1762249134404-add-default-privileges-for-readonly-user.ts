import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultPrivilegesForReadonlyUser1762249134404
  implements MigrationInterface
{
  name = 'AddDefaultPrivilegesForReadonlyUser1762249134404';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const doesReadonlyuserExist = await queryRunner.query(
      `SELECT * FROM pg_roles WHERE rolname='readonlyuser'`,
    );
    if (doesReadonlyuserExist.length === 0) {
      await queryRunner.query(
        `CREATE ROLE "readonly_user" WITH
          LOGIN
          PASSWORD 'password'
          NOSUPERUSER
          NOINHERIT
          NOCREATEDB
          NOCREATEROLE
          NOREPLICATION
          CONNECTION LIMIT 10
          ;`,
      );
    }
    await queryRunner.query(
      `GRANT USAGE ON SCHEMA "121-service" TO "readonly_user";`,
    );
    await queryRunner.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA "121-service" TO "readonly_user";`,
    );
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "121-service" GRANT SELECT ON TABLES TO "readonly_user";`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // only up
  }
}
