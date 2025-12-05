import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.service';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

describe('IntersolveVisaAccountManagementService', () => {
  function mockGetRegistrationOrThrow(returnValue: any) {
    jest
      .spyOn(service, 'getRegistrationOrThrow')
      .mockResolvedValue(returnValue);
  }
  let service: IntersolveVisaAccountManagementService;
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let queueMessageService: jest.Mocked<MessageQueuesService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;
  let registrationDataScopedRepository: jest.Mocked<RegistrationDataScopedRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntersolveVisaAccountManagementService,
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
      ],
    }).compile();

    service = module.get(IntersolveVisaAccountManagementService);
    queueMessageService = module.get(MessageQueuesService);
    intersolveVisaService = module.get(IntersolveVisaService);
    programFspConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    );
    registrationDataScopedRepository = module.get(
      RegistrationDataScopedRepository,
    );
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
        service.linkDebitCardToRegistration('ref-1', 1, 'token-1'),
      ).rejects.toThrow(
        'Card is already linked to another customer at Intersolve.',
      );
    });

    it('links the card when wallet is unlinked', async () => {
      intersolveVisaService.getWallet.mockResolvedValue({
        holderId: null,
      } as any);
      mockGetRegistrationOrThrow(registration);

      // Mock registration data used to build contact information
      registrationDataScopedRepository.getRegistrationDataArrayByName.mockResolvedValue(
        [
          { name: 'addressStreet', value: 'Main' },
          { name: 'addressHouseNumber', value: '10' },
          { name: 'addressHouseNumberAddition', value: 'A' },
          { name: 'addressPostalCode', value: '1234AB' },
          { name: 'addressCity', value: 'Amsterdam' },
          { name: 'phoneNumber', value: '31612345678' },
          { name: 'fullName', value: 'Jane Doe' },
        ] as any,
      );

      const customer = { id: 1 } as any;
      intersolveVisaService.getCustomerOrCreate.mockResolvedValue(customer);

      const parentWallet = { tokenCode: 'parent-token' } as any;
      intersolveVisaService.getParentWalletOrCreate.mockResolvedValue(
        parentWallet,
      );

      // Mock FSP configuration repository to return brand/cover letter codes
      (
        programFspConfigurationRepository.getPropertiesByNamesOrThrow as jest.Mock
      ).mockResolvedValue([
        {
          name: FspConfigurationProperties.brandCode,
          value: 'BRAND',
        },
        {
          name: FspConfigurationProperties.coverLetterCode,
          value: 'COVER',
        },
      ]);

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
      // Ensure customer was created with contact info
      expect(intersolveVisaService.getCustomerOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          registrationId: registration.id,
          createCustomerReference: 'ref-1',
          name: 'Jane Doe',
          contactInformation: expect.objectContaining({
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
