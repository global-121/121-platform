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
    // Subquery to aggregate attributes per event
    const attributesAggregate = dataSource
      .createQueryBuilder()
      .select('attr.eventId', 'eventId')
      .addSelect(
        `MAX(CASE WHEN attr.key = '${RegistrationEventAttributeKeyEnum.fieldName}' THEN attr.value END)`,
        'fieldName',
      )
      .addSelect(
        `MAX(CASE WHEN attr.key = '${RegistrationEventAttributeKeyEnum.oldValue}' THEN attr.value END)`,
        'oldValue',
      )
      .addSelect(
        `MAX(CASE WHEN attr.key = '${RegistrationEventAttributeKeyEnum.newValue}' THEN attr.value END)`,
        'newValue',
      )
      .addSelect(
        `MAX(CASE WHEN attr.key = '${RegistrationEventAttributeKeyEnum.reason}' THEN attr.value END)`,
        'reason',
      )
      .from(RegistrationEventAttributeEntity, 'attr')
      .groupBy('attr.eventId');

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
          WHEN event.type = '${RegistrationEventEnum.registrationDataChange}' THEN attributes."fieldName"
          WHEN event.type = '${RegistrationEventEnum.fspChange}' THEN 'FSP'
          ELSE NULL
        END
      `,
        'fieldChanged',
      )
      .addSelect('attributes."oldValue"', 'oldValue')
      .addSelect('attributes."newValue"', 'newValue')
      .addSelect('attributes."reason"', 'reason')
      .from(RegistrationEventEntity, 'event')
      .leftJoin(
        '(' + attributesAggregate.getQuery() + ')',
        'attributes',
        'attributes."eventId" = event.id',
      )
      .leftJoin(
        RegistrationEntity,
        'registration',
        'registration.id = event.registrationId',
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
