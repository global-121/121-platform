import { MigrationInterface, QueryRunner } from 'typeorm';

import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';

export class MigrateDataChangesToEvent1708330965061
  implements MigrationInterface
{
  name = 'MigrateDataChangesToEvent1708330965061';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b8c3aeeac35ace9d387fb5e142"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b35693f96b1b13156954752023"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_5c7356500932acbd5f76a787ce"`,
    );
    const manager = queryRunner.manager;
    const eventRepo = manager.getRepository(RegistrationEventEntity);
    const keysToMigrate = ['fieldName', 'oldValue', 'newValue', 'reason'];
    const registrationDataChanges = await queryRunner.query(
      `SELECT * FROM "121-service".registration_change_log`,
    );

    const mappedEvents = registrationDataChanges.map((change: any) => {
      const event = new RegistrationEventEntity();
      event.created = change.created;
      event.updated = change.updated;
      event.userId = change.userId;
      event.registrationId = change.registrationId;
      event.type = RegistrationEventEnum.registrationDataChange;
      event.attributes = [];
      Object.entries(change).forEach(([key, value]) => {
        if (keysToMigrate.includes(key)) {
          const attributeEntity = new RegistrationEventAttributeEntity();
          attributeEntity.key = key as RegistrationEventAttributeKeyEnum;
          attributeEntity.value = value as string;
          event.attributes.push(attributeEntity);
        }
      });
      return event;
    });
    await eventRepo.save(mappedEvents, { chunk: 300 });
    await queryRunner.query(
      `CREATE INDEX "IDX_5c7356500932acbd5f76a787ce" ON "121-service"."event_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b35693f96b1b13156954752023" ON "121-service"."event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8c3aeeac35ace9d387fb5e142" ON "121-service"."event" ("type") `,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service".registration_change_log `,
    );
  }
}
