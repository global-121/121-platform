import { MigrationInterface, QueryRunner } from 'typeorm';

export class indexPayment1669106233197 implements MigrationInterface {
  name = 'indexPayment1669106233197';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_ea52d8a2faad81796097568a41" ON "121-service"."transaction" ("payment") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ea52d8a2faad81796097568a41"`,
    );
  }
}
