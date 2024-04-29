import { MigrationInterface, QueryRunner } from 'typeorm';
import { EventAttributeEntity } from '../src/events/entities/event-attribute.entity';
import { EventEntity } from '../src/events/entities/event.entity';
import { EventAttributeKeyEnum } from '../src/events/enum/event-attribute-key.enum';
import { EventEnum } from '../src/events/enum/event.enum';

export class MigrateStatusesToDeclined1713422095087
  implements MigrationInterface
{
  name = 'MigrateStatusesToDeclined1713422095087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateRegistrationsStatus(queryRunner);
    // Start artificial transaction because TypeORM migrations automatically try to close a transaction after migration
    await queryRunner.startTransaction();
    await queryRunner.query(
      `UPDATE "121-service"."registration"
        SET "registrationStatus" = 'declined'
        WHERE "registrationStatus" IN ('inclusionEnded', 'rejected', 'noLongerEligible')`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}

  // Function to save event for each registration status chnage
  private async migrateRegistrationsStatus(
    queryRunner: QueryRunner,
  ): Promise<void> {
    console.time('migrateStatusChanges');
    const manager = queryRunner.manager;
    const eventRepo = manager.getRepository(EventEntity);
    const adminUser = await queryRunner.query(
      `SELECT * FROM "121-service"."user" WHERE admin = true AND username LIKE '%admin%' ORDER BY id LIMIT 1`,
    );

    const registrationsToChange = await queryRunner.query(
      `SELECT * FROM "121-service"."registration" WHERE "registrationStatus" IN ('inclusionEnded', 'rejected', 'noLongerEligible')`,
    );

    const events = registrationsToChange.map((registration: any) => {
      const event = new EventEntity();
      event.userId = adminUser[0]?.id ? adminUser[0].id : 1;
      event.registrationId = registration.id;
      event.type = EventEnum.registrationStatusChange;
      event.attributes = [];

      const attributeOldValue = new EventAttributeEntity();
      attributeOldValue.key = EventAttributeKeyEnum.oldValue;
      attributeOldValue.value = registration.registrationStatus;
      event.attributes.push(attributeOldValue);

      const attributeNewValue = new EventAttributeEntity();
      attributeNewValue.key = EventAttributeKeyEnum.newValue;
      attributeNewValue.value = 'declined';
      event.attributes.push(attributeNewValue);

      return event;
    });

    await eventRepo.save(events, { chunk: 300 });
    console.timeEnd('migrateStatusChanges');
  }
}
