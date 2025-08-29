import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventAttributeKeyEnum } from '@121-service/src/registration-events/enum/registration-event-attribute-key.enum';
import { RegistrationEventsMapper } from '@121-service/src/registration-events/utils/registration-events.mapper';
import { UserEntity } from '@121-service/src/user/user.entity';

describe('RegistrationEventsMapper', () => {
  let eventEntity: RegistrationEventEntity;
  let eventAttributeEntity: RegistrationEventAttributeEntity;

  beforeEach(() => {
    eventAttributeEntity = new RegistrationEventAttributeEntity();
    eventAttributeEntity.key = RegistrationEventAttributeKeyEnum.fieldName;
    eventAttributeEntity.value = 'value';

    const user = new UserEntity();
    user.id = 1;
    user.username = 'username';

    const registration = new RegistrationEntity();
    registration.id = 1;
    registration.referenceId = 'referenceId';
    registration.registrationProjectId = 1;

    eventEntity = new RegistrationEventEntity();
    eventEntity.id = 1;
    eventEntity.created = new Date();
    eventEntity.userId = 1;
    eventEntity.user = user;
    eventEntity.registrationId = 1;
    eventEntity.registration = registration;
    eventEntity.type = RegistrationEventEnum.registrationDataChange;
    eventEntity.attributes = [eventAttributeEntity];
  });

  it('should map RegistrationEventEntity[] to GetRegistrationEventDto[]', () => {
    const result = RegistrationEventsMapper.mapEventsToJsonDtos([eventEntity]);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toEqual(1);
    const dto = result[0];
    expect(dto.id).toEqual(eventEntity.id);
    expect(dto.created).toEqual(eventEntity.created);
    expect(dto.user?.id).toEqual(eventEntity.userId);
    expect(dto.user?.username).toEqual(eventEntity.user.username);
    expect(dto.registrationId).toEqual(eventEntity.registrationId);
    expect(dto.type).toEqual(eventEntity.type);
    expect(dto.attributes).toEqual({
      [eventAttributeEntity.key]: eventAttributeEntity.value,
    });
  });

  it('should map RegistrationEventEntity[] to GetRegistrationEventXlsxDto[]', () => {
    const result = RegistrationEventsMapper.mapEventsToXlsxDtos([eventEntity]);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toEqual(1);
    const dto = result[0];
    expect(dto.paId).toEqual(eventEntity.registration.registrationProjectId);
    expect(dto.referenceId).toEqual(eventEntity.registration.referenceId);
    expect(dto.changedAt).toEqual(eventEntity.created);
    expect(dto.changedBy).toEqual(eventEntity.user.username);
    expect(dto.type).toEqual(eventEntity.type);
    expect(dto[eventAttributeEntity.key]).toEqual(eventAttributeEntity.value);
  });
});
