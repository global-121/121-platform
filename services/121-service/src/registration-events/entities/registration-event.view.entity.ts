import {
  DataSource,
  JoinColumn,
  ManyToOne,
  Relation,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { Base121OptionalAuditedEntity } from '@121-service/src/base-audited.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@ViewEntity({
  name: 'registration_event_view',
  expression: (dataSource: DataSource) => {
    return dataSource
      .createQueryBuilder()
      .select('event.id', 'id')
      .addSelect('event.userId', 'userId')
      .addSelect('event.created', 'created')
      .addSelect('event.updated', 'updated')
      .addSelect('registration.registrationProgramId', 'registrationProgramId')
      .addSelect('registration.programId', 'programId')
      .addSelect(
        `
        CASE
          WHEN event.type = '${RegistrationEventEnum.registrationStatusChange}' THEN 'Status'
          WHEN event.type = '${RegistrationEventEnum.registrationDataChange}' THEN "fieldNameAttr"."value"
          WHEN event.type = '${RegistrationEventEnum.fspChange}' THEN 'FSP'
          ELSE NULL
        END
      `,
        'fieldChanged',
      )
      .addSelect('oldValueAttr.value', 'oldValue')
      .addSelect('newValueAttr.value', 'newValue')
      .addSelect('reasonAttr.value', 'reason')
      .from(RegistrationEventEntity, 'event')
      .leftJoin(
        RegistrationEntity,
        'registration',
        'registration.id = event.registrationId',
      )
      .leftJoin(
        RegistrationEventAttributeEntity,
        'fieldNameAttr',
        `fieldNameAttr.eventId = event.id AND fieldNameAttr.key = '${RegistrationEventAttributeKeyEnum.fieldName}'`,
      )
      .leftJoin(
        RegistrationEventAttributeEntity,
        'oldValueAttr',
        `oldValueAttr.eventId = event.id AND oldValueAttr.key = '${RegistrationEventAttributeKeyEnum.oldValue}'`,
      )
      .leftJoin(
        RegistrationEventAttributeEntity,
        'newValueAttr',
        `newValueAttr.eventId = event.id AND newValueAttr.key = '${RegistrationEventAttributeKeyEnum.newValue}'`,
      )
      .leftJoin(
        RegistrationEventAttributeEntity,
        'reasonAttr',
        `reasonAttr.eventId = event.id AND reasonAttr.key = '${RegistrationEventAttributeKeyEnum.reason}'`,
      )
      .where(`event.type != '${RegistrationEventEnum.ignoredDuplicate}'`); // ##TODO for now exclude this, but figure out what to do
  },
})
export class RegistrationEventViewEntity extends Base121OptionalAuditedEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @ViewColumn()
  public registrationProgramId: number;

  @ViewColumn()
  public programId: number;

  @ViewColumn()
  public fieldChanged: string;

  @ViewColumn()
  public oldValue: string | null;

  @ViewColumn()
  public newValue: string;

  @ViewColumn()
  public reason: string | null;
}
