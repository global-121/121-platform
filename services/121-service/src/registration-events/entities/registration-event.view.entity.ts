import {
  DataSource,
  JoinColumn,
  ManyToOne,
  Relation,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

export const STATUS_CHANGE_STRING = 'Status';

@ViewEntity({
  name: 'registration_event_view',
  expression: (dataSource: DataSource) => {
    return dataSource
      .createQueryBuilder()
      .select('event.id', 'id')
      .addSelect('event.userId', 'userId')
      .addSelect('event.created', 'created')
      .addSelect('event.updated', 'updated')
      .addSelect('registration.id', 'registrationId')
      .addSelect('registration.registrationProgramId', 'registrationProgramId')
      .addSelect('registration.programId', 'programId')
      .addSelect('event.type', 'type')
      .addSelect('fieldNameAttr.value', 'fieldChanged')
      .addSelect('oldValueAttr.value', 'oldValue')
      .addSelect('newValueAttr.value', 'newValue')
      .addSelect('reasonAttr.value', 'reason')
      .addSelect('user.username', 'username')
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
      .leftJoin(UserEntity, 'user', 'user.id = event.userId');
  },
})
export class RegistrationEventViewEntity extends Base121Entity {
  @ViewColumn()
  public programId: number;

  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.events,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @ViewColumn()
  public registrationId: number;

  @ViewColumn()
  public registrationProgramId: number;

  @ViewColumn()
  public type: RegistrationEventEnum;

  @ViewColumn()
  public fieldChanged: string;

  @ViewColumn()
  public oldValue: string | null;

  @ViewColumn()
  public newValue: string;

  @ViewColumn()
  public reason: string | null;

  @ViewColumn()
  public username: string;
}
