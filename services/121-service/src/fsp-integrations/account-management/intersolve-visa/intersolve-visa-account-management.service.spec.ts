import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/intersolve-visa-account-management.service';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa/intersolve-visa-data-synchronization.service';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

describe('IntersolveVisaAccountManagementService', () => {
  function mockGetRegistrationOrThrow(returnValue: any) {
    jest
      .spyOn(registrationsService, 'getRegistrationOrThrow')
      .mockResolvedValue(returnValue);
  }
  let service: IntersolveVisaAccountManagementService;
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let queueMessageService: jest.Mocked<MessageQueuesService>;
  let registrationsService: jest.Mocked<RegistrationsService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;

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
            linkPhysicalCardToRegistration: jest.fn(),
            pauseCardOrThrow: jest.fn(),
            retrieveAndUpdateWallet: jest.fn(),
            getWalletWithCards: jest.fn(),
            hasIntersolveCustomer: jest.fn(),
            replaceCard: jest.fn(),
            sendUpdatedCustomerInformation: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            getPropertyValueByName: jest.fn().mockResolvedValue(undefined),
            getPropertyValueByNameOrThrow: jest
              .fn()
              .mockImplementation(async ({ name }) => {
                if (name === FspConfigurationProperties.brandCode)
                  return 'BRAND';
                if (name === FspConfigurationProperties.cardDistributionByMail)
                  return false;
                return undefined;
              }),
          },
        },
        {
          provide: IntersolveVisaChildWalletScopedRepository,
          useValue: {
            isChildWalletLinkedToRegistration: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(IntersolveVisaAccountManagementService);
    queueMessageService = module.get(MessageQueuesService);
    intersolveVisaService = module.get(IntersolveVisaService);
    registrationsService = module.get(
      RegistrationsService,
    ) as jest.Mocked<RegistrationsService>;
    programFspConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    ) as jest.Mocked<ProgramFspConfigurationRepository>;
  });

  describe('linkDebitCardToRegistration', () => {
    const registration = {
      id: 7,
      referenceId: 'ref-1',
      programFspConfigurationId: 123,
    } as unknown as RegistrationEntity;

    it('throws when wallet is already linked', async () => {
      mockGetRegistrationOrThrow(registration);
      intersolveVisaService.getWallet.mockResolvedValue({ holderId: 1 } as any);

      await expect(
        service.linkCardOnSiteToRegistration({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: 'token-1',
        }),
      ).rejects.toThrow('Card is already linked to someone else.');
    });

    it('links the card when wallet is unlinked', async () => {
      intersolveVisaService.getWallet.mockResolvedValue({
        holderId: null,
      } as any);
      mockGetRegistrationOrThrow(registration);

      await service.linkCardOnSiteToRegistration({
        referenceId: 'ref-1',
        programId: 1,
        tokenCode: 'child-token',
      });

      expect(
        intersolveVisaService.linkPhysicalCardToRegistration,
      ).toHaveBeenCalledWith({
        contactInformation: expect.objectContaining({
          name: 'Jane Doe',
          addressStreet: 'Main',
          addressHouseNumber: '10',
          addressHouseNumberAddition: 'A',
          addressPostalCode: '1234AB',
          addressCity: 'Amsterdam',
          phoneNumber: '31612345678',
        }),
        referenceId: 'ref-1',
        registrationId: registration.id,
        tokenCode: 'child-token',
        brandCode: 'BRAND',
      });
    });

    it('throws NOT_FOUND when token code does not start with configured prefix', async () => {
      mockGetRegistrationOrThrow(registration);
      programFspConfigurationRepository.getPropertyValueByName.mockResolvedValue(
        '1234',
      );

      await expect(
        service.linkCardOnSiteToRegistration({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: '9999000011112222333',
        }),
      ).rejects.toMatchObject({ status: 404 });

      expect(intersolveVisaService.getWallet).not.toHaveBeenCalled();
    });

    it('proceeds to Intersolve check when token code starts with configured prefix', async () => {
      mockGetRegistrationOrThrow(registration);
      programFspConfigurationRepository.getPropertyValueByName.mockResolvedValue(
        '1234',
      );
      intersolveVisaService.getWallet.mockResolvedValue({
        holderId: null,
      } as any);

      await service.linkCardOnSiteToRegistration({
        referenceId: 'ref-1',
        programId: 1,
        tokenCode: '1234000011112222333',
      });

      expect(intersolveVisaService.getWallet).toHaveBeenCalledWith(
        '1234000011112222333',
      );
    });

    it('skips prefix validation when tokenCodePrefix is not configured', async () => {
      mockGetRegistrationOrThrow(registration);
      // getPropertyValueByName already returns undefined by default
      intersolveVisaService.getWallet.mockResolvedValue({
        holderId: null,
      } as any);

      await service.linkCardOnSiteToRegistration({
        referenceId: 'ref-1',
        programId: 1,
        tokenCode: 'any-token-code-19c',
      });

      expect(intersolveVisaService.getWallet).toHaveBeenCalledWith(
        'any-token-code-19c',
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
