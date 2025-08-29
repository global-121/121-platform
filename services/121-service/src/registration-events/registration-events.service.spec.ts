import { TestBed } from '@automock/jest';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventScopedRepository } from '@121-service/src/registration-events/registration-event.repository';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserService } from '@121-service/src/user/user.service';
import { UserType } from '@121-service/src/user/user-type-enum';

const projectId = 1;

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
  value: FspAttributes.whatsappPhoneNumber,
};

const mockFindEventResult: RegistrationEventEntity[] = [
  {
    id: 5,
    created: '2024-02-20T11:12:18.597Z',
    userId: 1,
    type: RegistrationEventEnum.registrationDataChange,
    registrationId: 1,
    registration: {
      id: 1,
      referenceId: '2982g82bdsf89sdsd',
      paymentAmountMultiplier: 3,
      registrationProjectId: 1,
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
  } as unknown as RegistrationEventEntity,
];

function getViewRegistration(): RegistrationViewEntity {
  return {
    id: 3,
    status: RegistrationStatusEnum.new,
    projectId: 3,
    registrationCreated: '2024-02-19T14:21:11.163Z',
    referenceId: '7e9bdf2118b3fb4ece93b6458815ab86',
    phoneNumber: '46631834076',
    preferredLanguage: LanguageEnum.en,
    inclusionScore: 0,
    paymentAmountMultiplier: 1,
    fspName: Fsps.intersolveVisa,
    projectFspConfigurationName: 'Intersolve-Visa',
    projectFspConfigurationLabel: {
      en: 'Visa debit card',
    },
    registrationProjectId: 2,
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

let registrationEventRepository: jest.Mocked<RegistrationEventScopedRepository>;
let oldViewRegistration: RegistrationViewEntity;
let newViewRegistration: RegistrationViewEntity;

describe('RegistrationEventsService', () => {
  let registrationEventsService: RegistrationEventsService;
  let userService: UserService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      RegistrationEventsService,
    ).compile();
    registrationEventRepository = unitRef.get(
      RegistrationEventScopedRepository,
    );
    userService = unitRef.get(UserService);
    registrationEventsService = unit;
    // Mock request user id
    registrationEventsService['request']['user']!['id'] = 2;

    jest
      .spyOn(registrationEventRepository, 'getManyByProjectIdAndSearchOptions')
      .mockResolvedValue(mockFindEventResult);

    jest.spyOn(userService, 'findById').mockResolvedValue({
      id: 2,
      userType: UserType.aidWorker,
      username: 'testUser',
      password: 'dummyPassword',
      hashPassword: async () => 'hashedPasswordDummy',
      projectAssignments: [],
    } as unknown as UserEntity);

    oldViewRegistration = getViewRegistration();
    newViewRegistration = getViewRegistration();
  });

  it('should be defined', () => {
    expect(registrationEventsService).toBeDefined();
  });

  it('should return events in json dto format', async () => {
    // Act
    const result = await registrationEventsService.getEventsAsJson({
      projectId,
      searchOptions: {},
    });

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

    const expectedAttributes = {
      [attributeEntityFieldName.key]: attributeEntityFieldName.value,
      [attributeEntityOldValue.key]: attributeEntityOldValue.value,
      [attributeEntityNewValue.key]: attributeEntityNewValue.value,
    };
    expect(resultEvent.attributes).toEqual(expectedAttributes);
  });

  it('should return events in flat dto format (which is used for excel export)', async () => {
    // Act
    const result = await registrationEventsService.getEventsAsXlsx({
      projectId,
      searchOptions: {},
    });

    const resultEvent = result[0];
    expect(resultEvent.changedAt).toBe(mockFindEventResult[0].created);
    expect(resultEvent.changedBy).toBe(mockFindEventResult[0].user.username);
    expect(resultEvent.fieldName).toBe(attributeEntityFieldName.value);
    expect(resultEvent.oldValue).toBe(attributeEntityOldValue.value);
    expect(resultEvent.newValue).toBe(attributeEntityNewValue.value);
    expect(resultEvent.paId).toBe(
      mockFindEventResult[0].registration.registrationProjectId,
    );
  });

  it('should create a registrationEvent of a data change', async () => {
    newViewRegistration.phoneNumber = '1234567890';
    const options = { reason: 'exampleReason' };

    // Act
    await registrationEventsService.createFromRegistrationViews(
      oldViewRegistration,
      newViewRegistration,
      options,
    );

    // Assert
    expect(registrationEventRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration.phoneNumber },
          { key: 'newValue', value: newViewRegistration.phoneNumber },
          { key: 'fieldName', value: 'phoneNumber' },
          { key: 'reason', value: options.reason },
        ],
        userId: 2,
      },
    ];

    expect(registrationEventRepository.save).toHaveBeenCalledWith(
      expectedEvents,
      {
        chunk: 2000,
      },
    );
  });

  it('should create registration events for an FSP change of intersolve visa to voucher whatsapp', async () => {
    // Changes that should be logged
    newViewRegistration[FspAttributes.whatsappPhoneNumber] = '1234567890';
    newViewRegistration['projectFspConfigurationLabel'] = {
      en: 'Albert Heijn voucher WhatsApp',
    };
    delete newViewRegistration[FspAttributes.addressCity];
    delete newViewRegistration[FspAttributes.addressPostalCode];
    delete newViewRegistration[FspAttributes.addressHouseNumberAddition];
    delete newViewRegistration[FspAttributes.addressHouseNumber];
    delete newViewRegistration[FspAttributes.addressStreet];

    // Changes that should not be logged
    newViewRegistration.projectFspConfigurationName =
      Fsps.intersolveVoucherWhatsapp;

    // Act
    await registrationEventsService.createFromRegistrationViews(
      oldViewRegistration,
      newViewRegistration,
    );

    // Assert
    expect(registrationEventRepository.save).toHaveBeenCalledTimes(1);
    const expectedRegistrationEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.fspChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration['projectFspConfigurationLabel'],
          },
          {
            key: 'newValue',
            value: newViewRegistration['projectFspConfigurationLabel'],
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration[FspAttributes.whatsappPhoneNumber],
          },
          {
            key: 'newValue',
            value: newViewRegistration[FspAttributes.whatsappPhoneNumber],
          },
          {
            key: 'fieldName',
            value: FspAttributes.whatsappPhoneNumber,
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration[FspAttributes.addressCity],
          },
          {
            key: 'fieldName',
            value: FspAttributes.addressCity,
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration[FspAttributes.addressPostalCode],
          },
          {
            key: 'fieldName',
            value: FspAttributes.addressPostalCode,
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          {
            key: 'fieldName',
            value: FspAttributes.addressHouseNumberAddition,
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration[FspAttributes.addressHouseNumber],
          },
          {
            key: 'fieldName',
            value: FspAttributes.addressHouseNumber,
          },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          {
            key: 'oldValue',
            value: oldViewRegistration[FspAttributes.addressStreet],
          },
          {
            key: 'fieldName',
            value: FspAttributes.addressStreet,
          },
        ],
        userId: 2,
      },
    ];

    for (const event of expectedRegistrationEvents) {
      expect(registrationEventRepository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({
          registrationId: event.registrationId,
          type: event.type,
          attributes: expect.arrayContaining(event.attributes),
          userId: event.userId,
        }),
        { chunk: 2000 },
      );
    }
    // Assert that for the intersolveVoucherWhatsapp change no event is created
    expect(registrationEventRepository.save).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          attributes: expect.arrayContaining([
            expect.objectContaining({
              key: 'fieldName',
              value: 'fsp',
            }),
          ]),
        }),
      ]),
      { chunk: 2000 },
    );
  });

  it('should create an event for a registration status change', async () => {
    newViewRegistration.phoneNumber = '1234567890';
    newViewRegistration.status = RegistrationStatusEnum.included;
    const options = { reason: 'exampleReason' };

    // Act
    await registrationEventsService.createFromRegistrationViews(
      oldViewRegistration,
      newViewRegistration,
      options,
    );

    // Assert
    expect(registrationEventRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationStatusChange,
        attributes: [
          { key: 'oldValue', value: RegistrationStatusEnum.new },
          { key: 'newValue', value: RegistrationStatusEnum.included },
          { key: 'reason', value: options.reason },
        ],
        userId: 2,
      },
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationDataChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration.phoneNumber },
          { key: 'newValue', value: newViewRegistration.phoneNumber },
          { key: 'fieldName', value: 'phoneNumber' },
          { key: 'reason', value: options.reason },
        ],
        userId: 2,
      },
    ];
    expect(registrationEventRepository.save).toHaveBeenCalledWith(
      expectedEvents,
      {
        chunk: 2000,
      },
    );
  });

  it('should create an event for a registration status change with a create event option', async () => {
    newViewRegistration.status = RegistrationStatusEnum.included;
    const options = {
      reason: 'exampleReason',
      explicitRegistrationPropertyNames: ['status'],
    };

    // Act
    await registrationEventsService.createFromRegistrationViews(
      oldViewRegistration,
      newViewRegistration,
      options,
    );

    // Assert
    expect(registrationEventRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
      {
        registrationId: oldViewRegistration.id,
        type: RegistrationEventEnum.registrationStatusChange,
        attributes: [
          {
            key: 'oldValue',
            value: RegistrationStatusEnum.new,
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
    expect(registrationEventRepository.save).toHaveBeenCalledWith(
      expectedEvents,
      {
        chunk: 2000,
      },
    );
  });
});
