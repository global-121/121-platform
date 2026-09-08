import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteAfricasTalkingNotificationEntity17211383860657 implements Omit<
  MigrationInterface,
  'down'
> {
  name = 'DeleteAfricasTalkingNotificationEntity17211383860657';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the table if it exists
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."at_notification"`,
    );
  }
}
