import { MigrationInterface, QueryRunner } from 'typeorm';

import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';

export class MigrateStatusChangesToEvent1708330966062 implements MigrationInterface {
  name = 'MigrateStatusChangesToEvent1708330966062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateStatusChanges(queryRunner);
    // Start artificial transaction because TypeORM migrations automatically try to close a transaction after migration
    await queryRunner.startTransaction();
    await queryRunner.query(
      'DROP table "121-service"."registration_status_change"',
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }

  private async migrateStatusChanges(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const eventRepo = manager.getRepository(RegistrationEventEntity);
    const adminUser = await queryRunner.query(
      `SELECT * FROM "121-service"."user" WHERE admin = true AND username LIKE '%admin%' ORDER BY id LIMIT 1`,
    );

    const registrationStatusChanges = await queryRunner.query(
      `SELECT * FROM "121-service"."registration_status_change" ORDER BY "registrationId", "created" ASC`,
    );

    let currentRegistrationId = null;
    let lastStatus = null;

    const events = registrationStatusChanges.map((change) => {
      // Reset lastStatus if we're processing a new registrationId
      if (currentRegistrationId !== change.registrationId) {
        currentRegistrationId = change.registrationId;
        lastStatus = null; // Reset last status for a new registration
      }

      const event = new RegistrationEventEntity();
      event.created = change.created;
      event.updated = change.updated;
      event.userId = adminUser[0]?.id ? adminUser[0].id : 1;
      event.registrationId = change.registrationId;
      event.type = RegistrationEventEnum.registrationStatusChange;
      event.attributes = [];

      // Add oldValue attribute only if lastStatus exists
      if (lastStatus) {
        const attributeOldValue = new RegistrationEventAttributeEntity();
        attributeOldValue.key = RegistrationEventAttributeKeyEnum.oldValue;
        attributeOldValue.value = lastStatus;
        event.attributes.push(attributeOldValue);
      }

      // Always add newValue attribute
      const attributeNewValue = new RegistrationEventAttributeEntity();
      attributeNewValue.key = RegistrationEventAttributeKeyEnum.newValue;
      attributeNewValue.value = change.registrationStatus;
      event.attributes.push(attributeNewValue);

      // Update lastStatus for the next iteration
      lastStatus = change.registrationStatus;

      return event;
    });

    await eventRepo.save(events, { chunk: 300 });
  }
}
