import { TestBed } from '@automock/jest';

import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { UserService } from '@121-service/src/user/user.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

function getViewRegistration(): RegistrationViewEntity {
  return {
    id: 3,
    status: RegistrationStatusEnum.new,
    programId: 3,
    registrationCreated: '2024-02-19T14:21:11.163Z',
    referenceId: '7e9bdf2118b3fb4ece93b6458815ab86',
    phoneNumber: '46631834076',
    preferredLanguage: RegistrationPreferredLanguage.en,
    inclusionScore: 0,
    paymentAmountMultiplier: 1,
    fspName: Fsps.intersolveVisa,
    programFspConfigurationName: 'Intersolve-Visa',
    programFspConfigurationLabel: {
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

let registrationEventRepository: jest.Mocked<
  ScopedRepository<RegistrationEventEntity>
>;
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
      getScopedRepositoryProviderName(RegistrationEventEntity),
    );
    userService = unitRef.get(UserService);
    registrationEventsService = unit;
    // Mock request user id
    registrationEventsService['request']['user']!['id'] = 2;

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
    expect(registrationEventsService).toBeDefined();
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

  it(`should create registration events for an FSP change of "${Fsps.intersolveVisa}" to "${Fsps.intersolveVoucherWhatsapp}}"`, async () => {
    // Changes that should be logged
    newViewRegistration[FspAttributes.whatsappPhoneNumber] = '1234567890';
    newViewRegistration['programFspConfigurationLabel'] = {
      en: 'Albert Heijn voucher WhatsApp',
    };
    delete newViewRegistration[FspAttributes.addressCity];
    delete newViewRegistration[FspAttributes.addressPostalCode];
    delete newViewRegistration[FspAttributes.addressHouseNumberAddition];
    delete newViewRegistration[FspAttributes.addressHouseNumber];
    delete newViewRegistration[FspAttributes.addressStreet];

    // Changes that should not be logged
    newViewRegistration.programFspConfigurationName =
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
            value: oldViewRegistration['programFspConfigurationLabel'],
          },
          {
            key: 'newValue',
            value: newViewRegistration['programFspConfigurationLabel'],
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
    expect(registrationEventRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          registrationId: oldViewRegistration.id,
          type: RegistrationEventEnum.registrationStatusChange,
          userId: 2,
          attributes: expect.arrayContaining([
            expect.objectContaining({
              key: 'fieldName',
              value: GenericRegistrationAttributes.status,
            }),
            expect.objectContaining({
              key: 'oldValue',
              value: RegistrationStatusEnum.new,
            }),
            expect.objectContaining({
              key: 'newValue',
              value: RegistrationStatusEnum.included,
            }),
            expect.objectContaining({ key: 'reason', value: options.reason }),
          ]),
        }),
        expect.objectContaining({
          registrationId: oldViewRegistration.id,
          type: RegistrationEventEnum.registrationDataChange,
          userId: 2,
          attributes: expect.arrayContaining([
            expect.objectContaining({
              key: 'fieldName',
              value: 'phoneNumber',
            }),
            expect.objectContaining({
              key: 'oldValue',
              value: oldViewRegistration.phoneNumber,
            }),
            expect.objectContaining({
              key: 'newValue',
              value: newViewRegistration.phoneNumber,
            }),
            expect.objectContaining({
              key: 'reason',
              value: options.reason,
            }),
          ]),
        }),
      ]),
      { chunk: 2000 },
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
    expect(registrationEventRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          registrationId: oldViewRegistration.id,
          type: RegistrationEventEnum.registrationStatusChange,
          userId: 2,
          attributes: expect.arrayContaining([
            expect.objectContaining({
              key: 'fieldName',
              value: GenericRegistrationAttributes.status,
            }),
            expect.objectContaining({
              key: 'oldValue',
              value: RegistrationStatusEnum.new,
            }),
            expect.objectContaining({
              key: 'newValue',
              value: RegistrationStatusEnum.included,
            }),
            expect.objectContaining({ key: 'reason', value: options.reason }),
          ]),
        }),
      ]),
      {
        chunk: 2000,
      },
    );
  });
});
