import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTransactionEventType1765535478739
  implements MigrationInterface
{
  name = 'DropTransactionEventType1765535478739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_695faaebd651cc12b4b295880d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" DROP COLUMN "type"`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down
  }
}
