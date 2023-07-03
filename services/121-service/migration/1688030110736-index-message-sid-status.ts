import { MigrationInterface, QueryRunner } from 'typeorm';

export class indexMessageSidStatus1688030110736 implements MigrationInterface {
  name = 'indexMessageSidStatus1688030110736';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_caaab4181d0f08eb11a9436c84" ON "121-service"."twilio_message" ("sid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f4b8e639a60977ab7f6ff399d" ON "121-service"."twilio_message" ("status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8f4b8e639a60977ab7f6ff399d"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_caaab4181d0f08eb11a9436c84"`,
    );
  }
}
