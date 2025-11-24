import { Test, TestingModule } from '@nestjs/testing';

import { DebitCardsIntersolveVisaService } from '@121-service/src/debit-cards-intersolve-visa/debit-cards-intersolve-visa.service';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

describe('DebitCardsIntersolveVisaService', () => {
  let service: DebitCardsIntersolveVisaService;
  let registrationScopedRepository: jest.Mocked<RegistrationScopedRepository>;
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let queueMessageService: jest.Mocked<MessageQueuesService>;
  let registrationsPaginationService: jest.Mocked<RegistrationsPaginationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebitCardsIntersolveVisaService,
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
            getParentWalletOrCreate: jest.fn(),
            linkParentWalletToCustomerIfUnlinked: jest.fn(),
            linkWallets: jest.fn(),
            pauseCardOrThrow: jest.fn(),
            retrieveAndUpdateWallet: jest.fn(),
            getWalletWithCards: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            getPropertiesByNamesOrThrow: jest.fn(),
          },
        },
        {
          provide: RegistrationDataScopedRepository,
          useValue: {
            getRegistrationDataArrayByName: jest.fn(),
          },
        },
        {
          provide: RegistrationScopedRepository,
          useValue: {
            getWithRelationsByReferenceIdAndProgramId: jest.fn(),
          },
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {
            getRegistrationViewsByReferenceIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DebitCardsIntersolveVisaService);
    queueMessageService = module.get(MessageQueuesService);
    intersolveVisaService = module.get(IntersolveVisaService);
    registrationScopedRepository = module.get(RegistrationScopedRepository);
    registrationsPaginationService = module.get(RegistrationsPaginationService);
  });

  describe('getRegistrationOrThrow', () => {
    it('throws when referenceId is empty', async () => {
      await expect(
        service.getRegistrationOrThrow({ referenceId: '', programId: 1 }),
      ).rejects.toThrow('ReferenceId is not set');
    });

    it('throws when registration cannot be found', async () => {
      registrationScopedRepository.getWithRelationsByReferenceIdAndProgramId.mockResolvedValue(
        null,
      );

      await expect(
        service.getRegistrationOrThrow({ referenceId: 'ref-1', programId: 1 }),
      ).rejects.toThrow('ReferenceId ref-1 is not known in this program');
    });

    it('returns the registration when it exists', async () => {
      const registration = { id: 10 } as RegistrationEntity;
      registrationScopedRepository.getWithRelationsByReferenceIdAndProgramId.mockResolvedValue(
        registration,
      );

      await expect(
        service.getRegistrationOrThrow({ referenceId: 'ref-1', programId: 1 }),
      ).resolves.toEqual(registration);
    });
  });

  describe('linkDebitCardToRegistration', () => {
    type RegistrationViews = Awaited<
      ReturnType<
        RegistrationsPaginationService['getRegistrationViewsByReferenceIds']
      >
    >;

    const registrationView = [
      {
        id: 7,
        name: 'Jane Doe',
        addressStreet: 'Main',
        addressHouseNumber: '10',
        addressHouseNumberAddition: 'A',
        addressPostalCode: '1234AB',
        addressCity: 'Amsterdam',
        phoneNumber: '31612345678',
      } as unknown as RegistrationViews[number],
    ] as RegistrationViews;

    it('throws when wallet is already linked', async () => {
      intersolveVisaService.getWallet.mockResolvedValue({ holderId: 1 } as any);

      await expect(
        service.linkDebitCardToRegistration('ref-1', 1, 'token-1'),
      ).rejects.toThrow('Card is alrealdy linked to another customer');
    });

    it('links the card when wallet is unlinked', async () => {
      intersolveVisaService.getWallet.mockResolvedValue({
        holderId: null,
      } as any);
      registrationsPaginationService.getRegistrationViewsByReferenceIds.mockResolvedValue(
        registrationView,
      );
      const customer = { id: 1 } as any;
      intersolveVisaService.getCustomerOrCreate.mockResolvedValue(customer);
      const parentWallet = { tokenCode: 'parent-token' } as any;
      intersolveVisaService.getParentWalletOrCreate.mockResolvedValue(
        parentWallet,
      );

      await service.linkDebitCardToRegistration('ref-1', 1, 'child-token');

      expect(
        intersolveVisaService.linkParentWalletToCustomerIfUnlinked,
      ).toHaveBeenCalledWith({
        intersolveVisaCustomer: customer,
        intersolveVisaParentWallet: parentWallet,
      });
      expect(intersolveVisaService.linkWallets).toHaveBeenCalledWith({
        parentTokenCode: 'parent-token',
        childTokenCode: 'child-token',
      });
    });
  });

  describe('pauseCardAndSendMessage', () => {
    const registration = { id: 77 } as RegistrationEntity;

    it('pauses a card and queues a notification', async () => {
      const wallet = { tokenCode: 'token' } as any;
      registrationScopedRepository.getWithRelationsByReferenceIdAndProgramId.mockResolvedValue(
        registration,
      );
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
      registrationScopedRepository.getWithRelationsByReferenceIdAndProgramId.mockResolvedValue(
        registration,
      );
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
