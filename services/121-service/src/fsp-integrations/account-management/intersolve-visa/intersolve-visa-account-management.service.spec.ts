import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/intersolve-visa-account-management.service';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa/intersolve-visa-data-synchronization.service';
import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaCardOrderRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-card-order.repository';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaWalletClosureScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-wallet-closure.scoped.repository';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

describe('IntersolveVisaAccountManagementService', () => {
  let service: IntersolveVisaAccountManagementService;
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let registrationsService: jest.Mocked<RegistrationsService>;
  let intersolveVisaChildWalletScopedRepository: jest.Mocked<IntersolveVisaChildWalletScopedRepository>;
  let walletClosureScopedRepository: jest.Mocked<IntersolveVisaWalletClosureScopedRepository>;
  let cardOrderRepository: jest.Mocked<IntersolveVisaCardOrderRepository>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;

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
            createMessageJobForRegistration: jest.fn(),
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
            issueTokenAndCreatePhysicalCard: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            getByProgramIdAndFspName: jest.fn(),
            getPropertyValueByNameOrThrow: jest
              .fn()
              .mockImplementation(async ({ name }) => {
                if (name === FspConfigurationProperties.brandCode)
                  return 'BRAND';
                if (name === FspConfigurationProperties.coverLetterCode)
                  return 'COVER_LETTER';
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
        {
          provide: IntersolveVisaCardOrderRepository,
          useValue: {
            save: jest.fn(),
            getForProgram: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(IntersolveVisaAccountManagementService);
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
    cardOrderRepository = module.get(
      IntersolveVisaCardOrderRepository,
    ) as jest.Mocked<IntersolveVisaCardOrderRepository>;
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
      expect(
        registrationsService.createMessageJobForRegistration,
      ).toHaveBeenCalledWith({
        referenceId: 'ref-1',
        programId: 1,
        messageTemplateKey: ProgramNotificationEnum.pauseVisaCard,
        messageContentType: MessageContentType.custom,
        extendedMessageProcessType:
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        userId: 9,
      });
    });

    it('sends unpause notification when pause is false', async () => {
      const wallet = { tokenCode: 'token' } as any;
      mockGetRegistrationOrThrow(registration);
      intersolveVisaService.pauseCardOrThrow.mockResolvedValue(wallet);

      await service.pauseCardAndSendMessage('ref-1', 1, 'token-1', false, 9);

      expect(
        registrationsService.createMessageJobForRegistration,
      ).toHaveBeenCalledWith({
        referenceId: 'ref-1',
        programId: 1,
        messageTemplateKey: ProgramNotificationEnum.unpauseVisaCard,
        messageContentType: MessageContentType.custom,
        extendedMessageProcessType:
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
      isTokenBlocked: false,
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
        isChildTokenBlocked: false,
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

  describe('visa card orders', () => {
    const visaFspConfigurations = [{ id: 123 }] as any;

    type CreateVisaCardOrderInput = Parameters<
      IntersolveVisaAccountManagementService['createVisaCardOrder']
    >[0];

    function buildOrderInput(
      overrides: Partial<CreateVisaCardOrderInput> = {},
    ): CreateVisaCardOrderInput {
      return {
        programId: 1,
        noOfCards: 1,
        addressStreet: 'Damrak',
        addressHouseNumber: '1',
        addressHouseNumberAddition: 'A',
        addressPostalCode: '1011AB',
        addressCity: 'Amsterdam',
        addressee: 'John Doe',
        userId: 7,
        ...overrides,
      };
    }

    beforeEach(() => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        visaFspConfigurations,
      );
      programFspConfigurationRepository.getPropertyValueByNameOrThrow.mockImplementation(
        async ({ name }) => {
          if (name === FspConfigurationProperties.cardDistributionByMail) {
            return false;
          }

          if (name === FspConfigurationProperties.brandCode) {
            return 'BRAND';
          }

          if (name === FspConfigurationProperties.coverLetterCode) {
            return 'COVER_LETTER';
          }

          if (name === FspConfigurationProperties.fundingTokenCode) {
            return 'FUNDING_TOKEN';
          }

          return '';
        },
      );
      intersolveVisaService.issueTokenAndCreatePhysicalCard.mockResolvedValue();
    });

    it('throws when the program has no visa configuration', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [] as any,
      );

      await expect(
        service.createVisaCardOrder(buildOrderInput()),
      ).rejects.toThrow(
        'Expected exactly 1 Intersolve Visa configuration for program 1, found 0.',
      );
    });

    it('throws when multiple visa configurations are found', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [{ id: 123 }, { id: 124 }] as any,
      );

      await expect(
        service.createVisaCardOrder(buildOrderInput()),
      ).rejects.toThrow(
        'Expected exactly 1 Intersolve Visa configuration for program 1, found 2.',
      );
    });

    it('throws when card distribution by mail is enabled', async () => {
      programFspConfigurationRepository.getPropertyValueByNameOrThrow.mockImplementation(
        async ({ name }) => {
          if (name === FspConfigurationProperties.cardDistributionByMail) {
            return true;
          }

          if (name === FspConfigurationProperties.brandCode) {
            return 'BRAND';
          }

          if (name === FspConfigurationProperties.coverLetterCode) {
            return 'COVER_LETTER';
          }

          return '';
        },
      );

      await expect(
        service.createVisaCardOrder(buildOrderInput()),
      ).rejects.toThrow(
        'Batch ordering Visa cards is only allowed when card distribution by mail is disabled.',
      );
    });

    it('throws when all card orders fail', async () => {
      intersolveVisaService.issueTokenAndCreatePhysicalCard.mockRejectedValue(
        new IntersolveVisaApiError('api error'),
      );

      await expect(
        service.createVisaCardOrder(buildOrderInput({ noOfCards: 2 })),
      ).rejects.toThrow(HttpException);
    });

    it('re-throws unexpected errors from issueTokenAndCreatePhysicalCard', async () => {
      intersolveVisaService.issueTokenAndCreatePhysicalCard.mockRejectedValue(
        new Error('unexpected'),
      );

      await expect(
        service.createVisaCardOrder(buildOrderInput()),
      ).rejects.toThrow('unexpected');
    });

    it('throws when persisting the order record fails', async () => {
      cardOrderRepository.save.mockRejectedValue(new Error('db down'));

      await expect(
        service.createVisaCardOrder(buildOrderInput()),
      ).rejects.toMatchObject({
        message:
          'Cards were ordered, but saving the batch record failed. Please contact support for reconciliation.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('returns the count of sent and ordered cards, counting only successes', async () => {
      intersolveVisaService.issueTokenAndCreatePhysicalCard
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new IntersolveVisaApiError('temporary error'))
        .mockResolvedValueOnce();

      const result = await service.createVisaCardOrder(
        buildOrderInput({ noOfCards: 3 }),
      );

      expect(result).toEqual({
        noOfCardsSent: 2,
        noOfCardsOrdered: 3,
      });
    });
  });

  describe('getVisaCardOrders', () => {
    it('returns mapped card orders', async () => {
      cardOrderRepository.getForProgram.mockResolvedValue([
        {
          id: 42,
          noOfCardsOrdered: 5,
          addressee: 'John Doe',
          addressStreet: 'Damrak',
          addressHouseNumber: '1',
          addressHouseNumberAddition: 'A',
          addressPostalCode: '1011AB',
          addressCity: 'Amsterdam',
          userId: 7,
          user: { username: 'manager@example.org' },
          created: new Date('2026-05-26T08:30:00.000Z'),
        },
      ] as any);

      const result = await service.getVisaCardOrders({
        programId: 1,
      });

      expect(result).toEqual([
        {
          id: 42,
          noOfCardsOrdered: 5,
          address: 'John Doe, Damrak 1 A, 1011AB, Amsterdam',
          orderedByUsername: 'manager@example.org',
          created: new Date('2026-05-26T08:30:00.000Z'),
        },
      ]);
    });
  });
});
