import { RegistrationEntity } from '../../registration/registration.entity';
import { UserEntity } from '../../user/user.entity';
import { EventAttributeEntity } from '../entities/event-attribute.entity';
import { EventEntity } from '../entities/event.entity';
import { EventAttributeKeyEnum } from '../enum/event-attribute-key.enum';
import { EventEnum } from '../enum/event.enum';
import { EventsMapper } from './events.mapper';

describe('EventsMapper', () => {
  let eventEntity: EventEntity;
  let eventAttributeEntity: EventAttributeEntity;

  beforeEach(() => {
    eventAttributeEntity = new EventAttributeEntity();
    eventAttributeEntity.key = EventAttributeKeyEnum.fieldName;
    eventAttributeEntity.value = 'value';

    const user = new UserEntity();
    user.id = 1;
    user.username = 'username';

    const registration = new RegistrationEntity();
    registration.id = 1;
    registration.referenceId = 'referenceId';
    registration.registrationProgramId = 1;

    eventEntity = new EventEntity();
    eventEntity.id = 1;
    eventEntity.created = new Date();
    eventEntity.userId = 1;
    eventEntity.user = user;
    eventEntity.registrationId = 1;
    eventEntity.registration = registration;
    eventEntity.type = EventEnum.registrationDataChange;
    eventEntity.attributes = [eventAttributeEntity];
  });

  it('should map EventEntity[] to GetEventDto[]', () => {
    const result = EventsMapper.mapEventsToJsonDtos([eventEntity]);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toEqual(1);
    const dto = result[0];
    expect(dto.id).toEqual(eventEntity.id);
    expect(dto.created).toEqual(eventEntity.created);
    expect(dto.user.id).toEqual(eventEntity.userId);
    expect(dto.user.username).toEqual(eventEntity.user.username);
    expect(dto.registrationId).toEqual(eventEntity.registrationId);
    expect(dto.type).toEqual(eventEntity.type);
    expect(dto.attributes).toEqual({
      [eventAttributeEntity.key]: eventAttributeEntity.value,
    });
  });

  it('should map EventEntity[] to GetEventXlsxDto[]', () => {
    const result = EventsMapper.mapEventsToXlsxDtos([eventEntity]);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toEqual(1);
    const dto = result[0];
    expect(dto.paId).toEqual(eventEntity.registration.registrationProgramId);
    expect(dto.referenceId).toEqual(eventEntity.registration.referenceId);
    expect(dto.changedAt).toEqual(eventEntity.created);
    expect(dto.changedBy).toEqual(eventEntity.user.username);
    expect(dto.type).toEqual(eventEntity.type);
    expect(dto[eventAttributeEntity.key]).toEqual(eventAttributeEntity.value);
  });
});
