import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.service';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.service';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

describe('IntersolveVisaAccountManagementService', () => {
  function mockGetRegistrationOrThrow(returnValue: any) {
    jest
      .spyOn(registrationsService, 'getRegistrationOrThrow')
      .mockResolvedValue(returnValue);
  }
  let service: IntersolveVisaAccountManagementService;
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let queueMessageService: jest.Mocked<MessageQueuesService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;
  let registrationsPaginationService: jest.Mocked<RegistrationsPaginationService>;
  let registrationsService: jest.Mocked<RegistrationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntersolveVisaAccountManagementService,
        {
          provide: RegistrationsService,
          useValue: {
            getRegistrationOrThrow: jest.fn(),
            getContactInformation: jest.fn().mockResolvedValue({
              name: 'Jane Doe',
              addressStreet: 'Main',
              addressHouseNumber: '10',
              addressHouseNumberAddition: 'A',
              addressPostalCode: '1234AB',
              addressCity: 'Amsterdam',
              phoneNumber: '31612345678',
            }),
          },
        },
        {
          provide: IntersolveVisaDataSynchronizationService,
          useValue: {
            syncData: jest.fn(),
          },
        },
        {
          provide: MessageQueuesService,
          useValue: {
            addMessageJob: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaService,
          useValue: {
            getWallet: jest.fn(),
            getCustomerOrCreate: jest.fn(),
            linkPhysicalCardToCustomer: jest.fn(),
            pauseCardOrThrow: jest.fn(),
            retrieveAndUpdateWallet: jest.fn(),
            getWalletWithCards: jest.fn(),
            hasIntersolveCustomer: jest.fn(),
            reissueCard: jest.fn(),
            sendUpdatedCustomerInformation: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            getPropertiesByNamesOrThrow: jest.fn(),
            getPropertyValueByName: jest
              .fn()
              .mockImplementation(async ({ name }) => {
                if (name === FspConfigurationProperties.brandCode)
                  return 'BRAND';
                if (name === FspConfigurationProperties.coverLetterCode)
                  return 'COVER';
                return undefined;
              }),
          },
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {
            getRegistrationViewsByReferenceIds: jest.fn(),
          },
        },
        {
          provide: RegistrationScopedRepository,
          useValue: {
            getWithRelationsByReferenceIdAndProgramId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(IntersolveVisaAccountManagementService);
    queueMessageService = module.get(MessageQueuesService);
    intersolveVisaService = module.get(IntersolveVisaService);
    programFspConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    );
    registrationsPaginationService = module.get(
      RegistrationsPaginationService,
    ) as jest.Mocked<RegistrationsPaginationService>;
    registrationsService = module.get(
      RegistrationsService,
    ) as jest.Mocked<RegistrationsService>;
  });

  describe('linkDebitCardToRegistration', () => {
    const registration = {
      id: 7,
      referenceId: 'ref-1',
      programFspConfigurationId: 123,
    } as unknown as RegistrationEntity;

    it('throws when wallet is already linked', async () => {
      intersolveVisaService.getWallet.mockResolvedValue({ holderId: 1 } as any);

      await expect(
        service.linkCardOnSiteToRegistration({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: 'token-1',
        }),
      ).rejects.toThrow(
        'Card is already linked to another customer at Intersolve.',
      );
    });

    it('links the card when wallet is unlinked', async () => {
      intersolveVisaService.getWallet.mockResolvedValue({
        holderId: null,
      } as any);
      mockGetRegistrationOrThrow(registration);

      registrationsPaginationService.getRegistrationViewsByReferenceIds.mockResolvedValue(
        [
          {
            [FspAttributes.addressStreet]: 'Main',
            [FspAttributes.addressHouseNumber]: '10',
            [FspAttributes.addressHouseNumberAddition]: 'A',
            [FspAttributes.addressPostalCode]: '1234AB',
            [FspAttributes.addressCity]: 'Amsterdam',
            [FspAttributes.phoneNumber]: '31612345678',
            [FspAttributes.fullName]: 'Jane Doe',
          } as any,
        ],
      );

      const customer = { id: 1 } as any;
      intersolveVisaService.getCustomerOrCreate.mockResolvedValue(customer);

      (
        programFspConfigurationRepository.getPropertyValueByName as jest.Mock
      ).mockImplementation(async ({ name }) => {
        if (name === FspConfigurationProperties.brandCode) return 'BRAND';
        return undefined;
      });

      await service.linkCardOnSiteToRegistration({
        referenceId: 'ref-1',
        programId: 1,
        tokenCode: 'child-token',
      });

      expect(
        intersolveVisaService.linkPhysicalCardToCustomer,
      ).toHaveBeenCalledWith({
        intersolveVisaCustomer: customer,
        tokenCode: 'child-token',
        brandCode: 'BRAND',
      });
      expect(intersolveVisaService.getCustomerOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          registrationId: registration.id,
          createCustomerReference: 'ref-1',
          contactInformation: expect.objectContaining({
            name: 'Jane Doe',
            addressStreet: 'Main',
            addressHouseNumber: '10',
            addressHouseNumberAddition: 'A',
            addressPostalCode: '1234AB',
            addressCity: 'Amsterdam',
            phoneNumber: '31612345678',
          }),
        }),
      );
    });
  });

  describe('pauseCardAndSendMessage', () => {
    const registration = { id: 77 } as RegistrationEntity;

    it('pauses a card and queues a notification', async () => {
      const wallet = { tokenCode: 'token' } as any;
      mockGetRegistrationOrThrow(registration);
      intersolveVisaService.pauseCardOrThrow.mockResolvedValue(wallet);

      const result = await service.pauseCardAndSendMessage(
        'ref-1',
        1,
        'token-1',
        true,
        9,
      );

      expect(result).toBe(wallet);
      expect(intersolveVisaService.pauseCardOrThrow).toHaveBeenCalledWith(
        'token-1',
        true,
      );
      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith({
        registration,
        messageTemplateKey: ProgramNotificationEnum.pauseVisaCard,
        messageContentType: MessageContentType.custom,
        messageProcessType:
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        userId: 9,
      });
    });

    it('sends unpause notification when pause is false', async () => {
      const wallet = { tokenCode: 'token' } as any;
      mockGetRegistrationOrThrow(registration);
      intersolveVisaService.pauseCardOrThrow.mockResolvedValue(wallet);

      await service.pauseCardAndSendMessage('ref-1', 1, 'token-1', false, 9);

      expect(queueMessageService.addMessageJob).toHaveBeenCalledWith({
        registration,
        messageTemplateKey: ProgramNotificationEnum.unpauseVisaCard,
        messageContentType: MessageContentType.custom,
        messageProcessType:
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        userId: 9,
      });
    });
  });
});
