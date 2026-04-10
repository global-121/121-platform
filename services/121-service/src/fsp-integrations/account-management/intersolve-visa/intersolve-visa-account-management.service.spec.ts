import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/intersolve-visa-account-management.service';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa/intersolve-visa-data-synchronization.service';
import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaWalletClosureScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-wallet-closure.scoped.repository';
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
  let service: IntersolveVisaAccountManagementService;
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let queueMessageService: jest.Mocked<MessageQueuesService>;
  let registrationsService: jest.Mocked<RegistrationsService>;
  let intersolveVisaChildWalletScopedRepository: jest.Mocked<IntersolveVisaChildWalletScopedRepository>;
  let walletClosureScopedRepository: jest.Mocked<IntersolveVisaWalletClosureScopedRepository>;

  function mockGetRegistrationOrThrow(returnValue: any) {
    jest
      .spyOn(registrationsService, 'getRegistrationOrThrow')
      .mockResolvedValue(returnValue);
  }

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
            closeCardOrThrow: jest.fn(),
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
            getPropertyValueByNameOrThrow: jest
              .fn()
              .mockImplementation(async ({ name }) => {
                if (name === FspConfigurationProperties.brandCode)
                  return 'BRAND';
                if (name === FspConfigurationProperties.cardDistributionByMail)
                  return false;
                if (name === FspConfigurationProperties.fundingTokenCode)
                  return 'FUNDING_TOKEN';
                return undefined;
              }),
          },
        },
        {
          provide: IntersolveVisaChildWalletScopedRepository,
          useValue: {
            isChildWalletLinkedToRegistration: jest.fn(),
            hasLinkedChildWalletForRegistrationId: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaWalletClosureScopedRepository,
          useValue: {
            getForExport: jest.fn(),
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
    intersolveVisaChildWalletScopedRepository = module.get(
      IntersolveVisaChildWalletScopedRepository,
    ) as jest.Mocked<IntersolveVisaChildWalletScopedRepository>;
    walletClosureScopedRepository = module.get(
      IntersolveVisaWalletClosureScopedRepository,
    ) as jest.Mocked<IntersolveVisaWalletClosureScopedRepository>;
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

  describe('closeCard', () => {
    const registration = {
      id: 7,
      referenceId: 'ref-1',
      programFspConfigurationId: 123,
    } as unknown as RegistrationEntity;

    const openWallet = {
      id: 42,
      tokenCode: 'child-token',
      cardStatus: IntersolveVisaCardStatus.CardOk,
      intersolveVisaParentWallet: { tokenCode: 'parent-token' },
    } as any;

    beforeEach(() => {
      mockGetRegistrationOrThrow(registration);
      intersolveVisaChildWalletScopedRepository.findOne.mockResolvedValue(
        openWallet,
      );
    });

    it('should close card successfully', async () => {
      intersolveVisaService.closeCardOrThrow.mockResolvedValue(undefined);

      await service.closeCard({
        referenceId: 'ref-1',
        programId: 1,
        tokenCode: 'child-token',
      });

      expect(intersolveVisaService.closeCardOrThrow).toHaveBeenCalledWith({
        childWalletId: openWallet.id,
        childTokenCode: openWallet.tokenCode,
        parentTokenCode: openWallet.intersolveVisaParentWallet.tokenCode,
        fundingTokenCode: 'FUNDING_TOKEN',
      });
    });

    it('should throw BAD_REQUEST when wallet is not found', async () => {
      intersolveVisaChildWalletScopedRepository.findOne.mockResolvedValue(null);

      await expect(
        service.closeCard({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: 'child-token',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Wallet with token code child-token not found',
          HttpStatus.BAD_REQUEST,
        ),
      );
      expect(intersolveVisaService.closeCardOrThrow).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST when card is already closed', async () => {
      intersolveVisaChildWalletScopedRepository.findOne.mockResolvedValue({
        ...openWallet,
        cardStatus: IntersolveVisaCardStatus.CardClosed,
      });

      await expect(
        service.closeCard({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: 'child-token',
        }),
      ).rejects.toThrow(
        new HttpException('Card is already closed', HttpStatus.BAD_REQUEST),
      );
      expect(intersolveVisaService.closeCardOrThrow).not.toHaveBeenCalled();
    });

    it('should catch IntersolveVisaApiError and rethrow as HttpException with BAD_REQUEST', async () => {
      intersolveVisaService.closeCardOrThrow.mockRejectedValue(
        new IntersolveVisaApiError('upstream failure'),
      );

      await expect(
        service.closeCard({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: 'child-token',
        }),
      ).rejects.toThrow(
        new HttpException('upstream failure', HttpStatus.BAD_REQUEST),
      );
    });

    it('should rethrow non-IntersolveVisaApiError errors as-is', async () => {
      const genericError = new Error('something unexpected');
      intersolveVisaService.closeCardOrThrow.mockRejectedValue(genericError);

      await expect(
        service.closeCard({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: 'child-token',
        }),
      ).rejects.toBe(genericError);

      await expect(
        service.closeCard({
          referenceId: 'ref-1',
          programId: 1,
          tokenCode: 'child-token',
        }),
      ).rejects.not.toBeInstanceOf(HttpException);
    });
  });

  describe('wallet closures export', () => {
    it('should convert cents to euros and map fields', async () => {
      walletClosureScopedRepository.getForExport.mockResolvedValue([
        {
          referenceId: 'ref-1',
          cardNumber: 'token-123',
          closedDate: new Date('2026-04-10'),
          amountBookedBackInCents: 2500,
        },
        {
          referenceId: 'ref-2',
          cardNumber: 'token-456',
          closedDate: new Date('2026-04-09'),
          amountBookedBackInCents: 0,
        },
      ]);

      const result = await service.getWalletClosuresExport({ programId: 1 });

      expect(walletClosureScopedRepository.getForExport).toHaveBeenCalledWith(
        1,
      );
      expect(result).toEqual([
        {
          referenceId: 'ref-1',
          cardNumber: 'token-123',
          closedDate: new Date('2026-04-10'),
          amountBookedBack: 25,
        },
        {
          referenceId: 'ref-2',
          cardNumber: 'token-456',
          closedDate: new Date('2026-04-09'),
          amountBookedBack: 0,
        },
      ]);
    });
  });
});
