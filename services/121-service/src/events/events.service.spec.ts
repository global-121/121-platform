import { TestBed } from '@automock/jest';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { LanguageEnum } from '../registration/enum/language.enum';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { UserType } from '../user/user-type-enum';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { getScopedRepositoryProviderName } from '../utils/scope/createScopedRepositoryProvider.helper';
import { EventEntity } from './entities/event.entity';
import { EventEnum } from './enum/event.enum';
import { EventsService } from './events.service';

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

function getViewRegistration(): RegistrationViewEntity {
  return {
    id: 3,
    status: RegistrationStatusEnum.registered,
    programId: 3,
    registrationCreated: '2024-02-19T14:21:11.163Z',
    registrationCreatedDate: '2024-02-19',
    referenceId: '7e9bdf2118b3fb4ece93b6458815ab86',
    phoneNumber: '46631834076',
    preferredLanguage: LanguageEnum.en,
    inclusionScore: 0,
    paymentAmountMultiplier: 1,
    financialServiceProvider: FspName.intersolveVisa,
    fspDisplayNamePortal: 'Visa debit card',
    registrationProgramId: 2,
    personAffectedSequence: 'PA #2',
    maxPayments: null,
    lastMessageStatus: 'sms: queued',
    paymentCount: 2,
    paymentCountRemaining: null,
    scope: '',
    addressCity: 'Stad',
    addressPostalCode: '1234AB',
    addressHouseNumberAddition: '',
    addressHouseNumber: '1',
    addressStreet: 'Teststraat',
    whatsappPhoneNumber: '21093940535',
    firstName: 'Jane',
    lastName: 'Doe',
    name: 'Jane Doe',
  } as any as RegistrationViewEntity;
}

let eventScopedRepository: jest.Mocked<any>;
let oldViewRegistration: RegistrationViewEntity;
let newViewRegistration: RegistrationViewEntity;

describe('EventsService', () => {
  let eventsService: EventsService;
  let userService: UserService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(EventsService).compile();
    eventScopedRepository = unitRef.get(
      getScopedRepositoryProviderName(EventEntity),
    );
    userService = unitRef.get(UserService);
    eventsService = unit;
    // Mock request user id
    eventsService['request']['user']['id'] = 2;

    jest
      .spyOn(eventScopedRepository, 'find')
      .mockResolvedValue(mockFindEventResult);

    jest.spyOn(userService, 'findById').mockResolvedValue({
      id: 2,
      userType: UserType.aidWorker,
      username: 'testUser',
      password: 'dummyPassword',
      hashPassword: async () => 'hashedPasswordDummy',
      programAssignments: [],
    } as UserEntity);

    oldViewRegistration = getViewRegistration();
    newViewRegistration = getViewRegistration();
  });

  it('should be defined', () => {
    expect(eventsService).toBeDefined();
  });

  it('should return events in json dto format', async () => {
    // Act
    const result = await eventsService.getEventsJsonDto(programId, {});

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
    const result = await eventsService.getEventsXlsxDto(programId, {});

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

  it('should log a data change', async () => {
    newViewRegistration.phoneNumber = '1234567890';
    const additionalAttributeObject = { reason: 'exampleReason' };

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration, {
      additionalLogAttributes: additionalAttributeObject,
    });

    // Assert
    expect(eventScopedRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration.phoneNumber },
          { key: 'newValue', value: newViewRegistration.phoneNumber },
          { key: 'fieldName', value: 'phoneNumber' },
          { key: 'reason', value: additionalAttributeObject.reason },
        ],
        userId: 2,
      },
    ];

    expect(eventScopedRepository.save).toHaveBeenCalledWith(expectedEvents, {
      chunk: 2000,
    });
  });

  it('should log an FSP change of intersolve visa to voucher whatsapp', async () => {
    // Changes that should be logged
    newViewRegistration['whatsappPhoneNumber'] = '1234567890';
    newViewRegistration['fspDisplayNamePortal'] =
      'Albert Heijn voucher WhatsApp"';
    delete newViewRegistration['addressCity'];
    delete newViewRegistration['addressPostalCode'];
    delete newViewRegistration['addressHouseNumberAddition'];
    delete newViewRegistration['addressHouseNumber'];
    delete newViewRegistration['addressStreet'];

    // Changes that should not be logged
    newViewRegistration.financialServiceProvider =
      FspName.intersolveVoucherWhatsapp;

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration);

    // Assert
    expect(eventScopedRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.financialServiceProviderChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration['fspDisplayNamePortal'],
          },
          {
            key: 'newValue',
            value: newViewRegistration['fspDisplayNamePortal'],
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration['whatsappPhoneNumber'],
          },
          {
            key: 'newValue',
            value: newViewRegistration['whatsappPhoneNumber'],
          },
          { key: 'fieldName', value: 'whatsappPhoneNumber' },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration['addressCity'] },
          { key: 'fieldName', value: 'addressCity' },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration['addressPostalCode'] },
          { key: 'fieldName', value: 'addressPostalCode' },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [{ key: 'fieldName', value: 'addressHouseNumberAddition' }],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration['addressHouseNumber'] },
          { key: 'fieldName', value: 'addressHouseNumber' },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration['addressStreet'] },
          { key: 'fieldName', value: 'addressStreet' },
        ],
        userId: 2,
      },
    ];

    for (const event of expectedEvents) {
      expect(eventScopedRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([event]),
        { chunk: 2000 },
      );
    }
    // Assert that the intersolveVoucherWhatsapp change is not logged
    expect(eventScopedRepository.save).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          attributes: expect.arrayContaining([
            expect.objectContaining({
              key: 'fieldName',
              value: 'financialServiceProvider',
            }),
          ]),
        }),
      ]),
      { chunk: 2000 },
    );
  });

  it('should log a registration status change', async () => {
    newViewRegistration.phoneNumber = '1234567890';
    newViewRegistration.status = RegistrationStatusEnum.included;
    const additionalAttributeObject = { reason: 'exampleReason' };

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration, {
      additionalLogAttributes: additionalAttributeObject,
    });

    // Assert
    expect(eventScopedRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationStatusChange,
        attributes: [
          { key: 'oldValue', value: RegistrationStatusEnum.registered },
          { key: 'newValue', value: RegistrationStatusEnum.included },
          { key: 'reason', value: additionalAttributeObject.reason },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration.phoneNumber },
          { key: 'newValue', value: newViewRegistration.phoneNumber },
          { key: 'fieldName', value: 'phoneNumber' },
          { key: 'reason', value: additionalAttributeObject.reason },
        ],
        userId: 2,
      },
    ];
    expect(eventScopedRepository.save).toHaveBeenCalledWith(expectedEvents, {
      chunk: 2000,
    });
  });

  it('should log a registration status change with event log option', async () => {
    newViewRegistration.status = RegistrationStatusEnum.included;
    const additionalAttributeObject = { reason: 'exampleReason' };

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration, {
      registrationAttributes: ['status'],
      additionalLogAttributes: additionalAttributeObject,
    });

    // Assert
    expect(eventScopedRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationStatusChange,
        attributes: [
          {
            key: 'oldValue',
            value: RegistrationStatusEnum.registered,
          },
          {
            key: 'newValue',
            value: RegistrationStatusEnum.included,
          },
          {
            key: 'reason',
            value: additionalAttributeObject.reason,
          },
        ],
        userId: 2,
      },
    ];
    expect(eventScopedRepository.save).toHaveBeenCalledWith(expectedEvents, {
      chunk: 2000,
    });
  });
});
