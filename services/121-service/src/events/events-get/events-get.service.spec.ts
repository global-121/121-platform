import { TestBed } from '@automock/jest';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import { EventEntity } from '../entities/event.entity';
import { EventGetService } from './events-get.service';

let eventScopedRepository: jest.Mocked<any>;

const programId = 1;

const attributeEntityOldValue = {
  key: 'oldValue',
  value: '11567803125',
};

const attributeEntityNewValue = {
  key: 'newValue',
  value: '31653956630',
};

const attributeEntityFieldName = {
  key: 'fieldName',
  value: 'whatsappPhoneNumber',
};

const mockFindEventResult = [
  {
    id: 5,
    created: '2024-02-20T11:12:18.597Z',
    userId: 1,
    type: 'registrationDataChange',
    registrationId: 1,
    registration: {
      id: 1,
      referenceId: '2982g82bdsf89sdsd',
      paymentAmountMultiplier: 3,
      registrationProgramId: 1,
    },
    user: {
      id: 1,
      username: 'test@example.org',
    },
    attributes: [
      attributeEntityOldValue,
      attributeEntityNewValue,
      attributeEntityFieldName,
    ],
  },
];

describe('EventsGetService', () => {
  let eventsGetService: EventGetService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(EventGetService).compile();
    eventScopedRepository = unitRef.get(
      getScopedRepositoryProviderName(EventEntity),
    );

    eventsGetService = unit;

    jest
      .spyOn(eventScopedRepository, 'find')
      .mockResolvedValue(mockFindEventResult);
  });

  it('should be defined', () => {
    expect(eventsGetService).toBeDefined();
  });

  it('should return events in json dto format', async () => {
    // Act
    const result = await eventsGetService.getEventsJsonDto(programId, {});

    const resultEvent = result[0];
    expect(resultEvent.id).toBe(mockFindEventResult[0].id);
    expect(resultEvent.created).toBe(mockFindEventResult[0].created);
    expect(resultEvent.user.id).toBe(mockFindEventResult[0].user.id);
    expect(resultEvent.user.username).toBe(
      mockFindEventResult[0].user.username,
    );
    expect(resultEvent.registrationId).toBe(
      mockFindEventResult[0].registration.id,
    );

    const expectedAttriutes = {
      [attributeEntityFieldName.key]: attributeEntityFieldName.value,
      [attributeEntityOldValue.key]: attributeEntityOldValue.value,
      [attributeEntityNewValue.key]: attributeEntityNewValue.value,
    };
    expect(resultEvent.attributes).toEqual(expectedAttriutes);
  });

  it('should return events in flat dto format (which is used for excel export)', async () => {
    // Act
    const result = await eventsGetService.getEventsXlsxDto(programId, {});

    const resultEvent = result[0];
    expect(resultEvent.changedAt).toBe(mockFindEventResult[0].created);
    expect(resultEvent.changedBy).toBe(mockFindEventResult[0].user.username);
    expect(resultEvent.fieldName).toBe(attributeEntityFieldName.value);
    expect(resultEvent.oldValue).toBe(attributeEntityOldValue.value);
    expect(resultEvent.newValue).toBe(attributeEntityNewValue.value);
    expect(resultEvent.paId).toBe(
      mockFindEventResult[0].registration.registrationProgramId,
    );
  });
});
