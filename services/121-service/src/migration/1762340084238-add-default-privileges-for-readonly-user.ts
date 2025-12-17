import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultPrivilegesForReadonlyUser1762340084238 implements MigrationInterface {
  name = 'AddDefaultPrivilegesForReadonlyUser1762340084238';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const doesReadonlyuserExist = await queryRunner.query(
      `SELECT * FROM pg_roles WHERE rolname='readonlyuser'`,
    );
    if (doesReadonlyuserExist.length === 0) {
      // We're not sure all instances have a readonly user.
      return;
    }
    await queryRunner.query(
      `GRANT USAGE ON SCHEMA "121-service" TO "readonlyuser";`,
    );
    await queryRunner.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA "121-service" TO "readonlyuser";`,
    );
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "121-service" GRANT SELECT ON TABLES TO "readonlyuser";`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // only up
  }
}
