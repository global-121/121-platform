import { TestBed } from '@automock/jest';

import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { EventScopedRepository } from '@121-service/src/events/event.repository';
import { EventsService } from '@121-service/src/events/events.service';
import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserService } from '@121-service/src/user/user.service';
import { UserType } from '@121-service/src/user/user-type-enum';

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
  value: FinancialServiceProviderAttributes.whatsappPhoneNumber,
};

const mockFindEventResult: EventEntity[] = [
  {
    id: 5,
    created: '2024-02-20T11:12:18.597Z',
    userId: 1,
    type: EventEnum.registrationDataChange,
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
  } as unknown as EventEntity,
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
    financialServiceProviderName: FinancialServiceProviders.intersolveVisa,
    programFinancialServiceProviderConfigurationName: 'Intersolve-Visa',
    programFinancialServiceProviderConfigurationLabel: {
      en: 'Visa debit card',
    },
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
  } as unknown as RegistrationViewEntity;
}

let eventRepository: jest.Mocked<EventScopedRepository>;
let oldViewRegistration: RegistrationViewEntity;
let newViewRegistration: RegistrationViewEntity;

describe('EventsService', () => {
  let eventsService: EventsService;
  let userService: UserService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(EventsService).compile();
    eventRepository = unitRef.get(EventScopedRepository);
    userService = unitRef.get(UserService);
    eventsService = unit;
    // Mock request user id
    eventsService['request']['user']!['id'] = 2;

    jest
      .spyOn(eventRepository, 'getManyByProgramIdAndSearchOptions')
      .mockResolvedValue(mockFindEventResult);

    jest.spyOn(userService, 'findById').mockResolvedValue({
      id: 2,
      userType: UserType.aidWorker,
      username: 'testUser',
      password: 'dummyPassword',
      hashPassword: async () => 'hashedPasswordDummy',
      programAssignments: [],
    } as unknown as UserEntity);

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
    expect(resultEvent.user?.id).toBe(mockFindEventResult[0].user.id);
    expect(resultEvent.user?.username).toBe(
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
    const options = { reason: 'exampleReason' };

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration, options);

    // Assert
    expect(eventRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration.phoneNumber },
          { key: 'newValue', value: newViewRegistration.phoneNumber },
          { key: 'fieldName', value: 'phoneNumber' },
          { key: 'reason', value: options.reason },
        ],
        userId: 2,
      },
    ];

    expect(eventRepository.save).toHaveBeenCalledWith(expectedEvents, {
      chunk: 2000,
    });
  });

  it('should log an FSP change of intersolve visa to voucher whatsapp', async () => {
    // Changes that should be logged
    newViewRegistration[
      FinancialServiceProviderAttributes.whatsappPhoneNumber
    ] = '1234567890';
    newViewRegistration['programFinancialServiceProviderConfigurationLabel'] = {
      en: 'Albert Heijn voucher WhatsApp',
    };
    delete newViewRegistration[FinancialServiceProviderAttributes.addressCity];
    delete newViewRegistration[
      FinancialServiceProviderAttributes.addressPostalCode
    ];
    delete newViewRegistration[
      FinancialServiceProviderAttributes.addressHouseNumberAddition
    ];
    delete newViewRegistration[
      FinancialServiceProviderAttributes.addressHouseNumber
    ];
    delete newViewRegistration[
      FinancialServiceProviderAttributes.addressStreet
    ];

    // Changes that should not be logged
    newViewRegistration.programFinancialServiceProviderConfigurationName =
      FinancialServiceProviders.intersolveVoucherWhatsapp;

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration);

    // Assert
    expect(eventRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.financialServiceProviderChange,
        attributes: [
          {
            key: 'oldValue',
            value:
              oldViewRegistration[
                'programFinancialServiceProviderConfigurationLabel'
              ],
          },
          {
            key: 'newValue',
            value:
              newViewRegistration[
                'programFinancialServiceProviderConfigurationLabel'
              ],
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
            value:
              oldViewRegistration[
                FinancialServiceProviderAttributes.whatsappPhoneNumber
              ],
          },
          {
            key: 'newValue',
            value:
              newViewRegistration[
                FinancialServiceProviderAttributes.whatsappPhoneNumber
              ],
          },
          {
            key: 'fieldName',
            value: FinancialServiceProviderAttributes.whatsappPhoneNumber,
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
            value:
              oldViewRegistration[
                FinancialServiceProviderAttributes.addressCity
              ],
          },
          {
            key: 'fieldName',
            value: FinancialServiceProviderAttributes.addressCity,
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
            value:
              oldViewRegistration[
                FinancialServiceProviderAttributes.addressPostalCode
              ],
          },
          {
            key: 'fieldName',
            value: FinancialServiceProviderAttributes.addressPostalCode,
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationDataChange,
        attributes: [
          {
            key: 'fieldName',
            value:
              FinancialServiceProviderAttributes.addressHouseNumberAddition,
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
            value:
              oldViewRegistration[
                FinancialServiceProviderAttributes.addressHouseNumber
              ],
          },
          {
            key: 'fieldName',
            value: FinancialServiceProviderAttributes.addressHouseNumber,
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
            value:
              oldViewRegistration[
                FinancialServiceProviderAttributes.addressStreet
              ],
          },
          {
            key: 'fieldName',
            value: FinancialServiceProviderAttributes.addressStreet,
          },
        ],
        userId: 2,
      },
    ];

    for (const event of expectedEvents) {
      expect(eventRepository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({
          registrationId: event.registrationId,
          type: event.type,
          attributes: expect.arrayContaining(event.attributes),
          userId: event.userId,
        }),
        { chunk: 2000 },
      );
    }
    // Assert that the intersolveVoucherWhatsapp change is not logged
    expect(eventRepository.save).not.toHaveBeenCalledWith(
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
    const options = { reason: 'exampleReason' };

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration, options);

    // Assert
    expect(eventRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: EventEnum.registrationStatusChange,
        attributes: [
          { key: 'oldValue', value: RegistrationStatusEnum.registered },
          { key: 'newValue', value: RegistrationStatusEnum.included },
          { key: 'reason', value: options.reason },
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
          { key: 'reason', value: options.reason },
        ],
        userId: 2,
      },
    ];
    expect(eventRepository.save).toHaveBeenCalledWith(expectedEvents, {
      chunk: 2000,
    });
  });

  it('should log a registration status change with event log option', async () => {
    newViewRegistration.status = RegistrationStatusEnum.included;
    const options = {
      reason: 'exampleReason',
      explicitRegistrationPropertyNames: ['status'],
    };

    // Act
    await eventsService.log(oldViewRegistration, newViewRegistration, options);

    // Assert
    expect(eventRepository.save).toHaveBeenCalledTimes(1);
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
            value: options.reason,
          },
        ],
        userId: 2,
      },
    ];
    expect(eventRepository.save).toHaveBeenCalledWith(expectedEvents, {
      chunk: 2000,
    });
  });
});
