import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { LanguageEnum } from '../../registration/enum/language.enum';
import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';
import { RegistrationViewEntity } from '../../registration/registration-view.entity';
import { EventEntity } from '../entities/event.entity';
import { EventEnum } from '../enum/event.enum';
import { EventsLogService } from './events-log.service';

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

let eventRepository: jest.Mocked<any>;
let oldViewRegistration: RegistrationViewEntity;
let newViewRegistration: RegistrationViewEntity;

describe('IntersolveVisaService', () => {
  let eventsLogService: EventsLogService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(EventsLogService).compile();
    eventRepository = unitRef.get(getRepositoryToken(EventEntity) as string);
    eventsLogService = unit;
    // Mock request user id
    eventsLogService['request']['userId'] = 2;

    oldViewRegistration = getViewRegistration();
    newViewRegistration = getViewRegistration();
  });

  it('should be defined', () => {
    expect(eventsLogService).toBeDefined();
  });

  it('should log a data change', async () => {
    newViewRegistration.phoneNumber = '1234567890';
    const additionalAttributeObject = { reason: 'exampleReason' };

    // Act
    await eventsLogService.log(
      oldViewRegistration,
      newViewRegistration,
      additionalAttributeObject,
    );

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
          { key: 'reason', value: additionalAttributeObject.reason },
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
    await eventsLogService.log(oldViewRegistration, newViewRegistration);

    // Assert
    expect(eventRepository.save).toHaveBeenCalledTimes(1);
    const expectedEvents = [
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
        type: EventEnum.financialServiceProviderChange,
        attributes: [
          { key: 'oldValue', value: oldViewRegistration.fspDisplayNamePortal },
          { key: 'newValue', value: newViewRegistration.fspDisplayNamePortal },
          { key: 'fieldName', value: 'fspDisplayNamePortal' },
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
      expect(eventRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([event]),
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
});
