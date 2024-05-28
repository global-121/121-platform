import { MigrationInterface, QueryRunner } from 'typeorm';

export class maxPayment241674140678259 implements MigrationInterface {
  name = 'maxPayment241674140678259';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE
        "121-service".registration
      SET
        "maxPayments" = 24
      WHERE
        "registrationStatus" IN ('imported', 'invited', 'registered', 'included')
        AND id IN(
        SELECT
          r.id
        FROM
          "121-service".registration r
        LEFT JOIN "121-service".program p ON
          r."programId" = p.id
        WHERE
          p.ngo = 'NLRC'
        )
        AND "maxPayments" is null
        `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
