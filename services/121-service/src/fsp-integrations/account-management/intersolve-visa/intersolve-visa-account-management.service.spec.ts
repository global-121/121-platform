import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { paginate } from 'nestjs-paginate';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/intersolve-visa-account-management.service';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa/intersolve-visa-data-synchronization.service';
import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaCardOrderRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-card-order.repository';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaWalletClosureScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-wallet-closure.scoped.repository';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

jest.mock('nestjs-paginate', () => {
  const actual = jest.requireActual('nestjs-paginate');
  return {
    ...actual,
    paginate: jest.fn(),
  };
});

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
            getPropertiesByNamesOrThrow: jest.fn(),
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
        {
          provide: IntersolveVisaCardOrderRepository,
          useValue: {
            save: jest.fn(),
            createQueryBuilderForProgram: jest.fn(),
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
    it('should order cards and persist only successful count', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [{ id: 123 }] as any,
      );
      programFspConfigurationRepository.getPropertiesByNamesOrThrow.mockResolvedValue(
        [
          { name: FspConfigurationProperties.brandCode, value: 'BRAND' },
          {
            name: FspConfigurationProperties.coverLetterCode,
            value: 'COVER_LETTER',
          },
          {
            name: FspConfigurationProperties.cardDistributionByMail,
            value: true,
          },
        ] as any,
      );

      intersolveVisaService.issueTokenAndCreatePhysicalCard
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new IntersolveVisaApiError('temporary error'))
        .mockResolvedValueOnce();

      const result = await service.createVisaCardOrder({
        programId: 1,
        noOfCards: 3,
        city: 'Amsterdam',
        postalCode: '1011AB',
        address: 'Damrak 1 A',
        addressee: 'John Doe',
        userId: 7,
      });

      expect(
        programFspConfigurationRepository.getByProgramIdAndFspName,
      ).toHaveBeenCalledWith({
        programId: 1,
        fspName: Fsps.intersolveVisa,
      });
      expect(
        intersolveVisaService.issueTokenAndCreatePhysicalCard,
      ).toHaveBeenCalledTimes(3);
      expect(
        intersolveVisaService.issueTokenAndCreatePhysicalCard,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          contactInformation: expect.objectContaining({
            phoneNumber: '+31600000000',
          }),
        }),
      );
      expect(cardOrderRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        noOfCardsSent: 3,
        noOfCardsOrdered: 2,
      });
    });

    it('should use provided phoneNumber for card ordering when supplied', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [{ id: 123 }] as any,
      );
      programFspConfigurationRepository.getPropertiesByNamesOrThrow.mockResolvedValue(
        [
          { name: FspConfigurationProperties.brandCode, value: 'BRAND' },
          {
            name: FspConfigurationProperties.coverLetterCode,
            value: 'COVER_LETTER',
          },
          {
            name: FspConfigurationProperties.cardDistributionByMail,
            value: true,
          },
        ] as any,
      );

      intersolveVisaService.issueTokenAndCreatePhysicalCard.mockResolvedValue();

      const result = await service.createVisaCardOrder({
        programId: 1,
        noOfCards: 1,
        city: 'Amsterdam',
        postalCode: '1011AB',
        address: 'Damrak 1 A',
        addressee: 'John Doe',
        phoneNumber: '+31612345678',
        userId: 7,
      });

      expect(
        intersolveVisaService.issueTokenAndCreatePhysicalCard,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          contactInformation: expect.objectContaining({
            phoneNumber: '+31612345678',
          }),
        }),
      );
      expect(result).toEqual({
        noOfCardsSent: 1,
        noOfCardsOrdered: 1,
      });
    });

    it('should throw when no card could be ordered', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [{ id: 123 }] as any,
      );
      programFspConfigurationRepository.getPropertiesByNamesOrThrow.mockResolvedValue(
        [
          { name: FspConfigurationProperties.brandCode, value: 'BRAND' },
          {
            name: FspConfigurationProperties.coverLetterCode,
            value: 'COVER_LETTER',
          },
          {
            name: FspConfigurationProperties.cardDistributionByMail,
            value: true,
          },
        ] as any,
      );

      intersolveVisaService.issueTokenAndCreatePhysicalCard.mockRejectedValue(
        new IntersolveVisaApiError('all failed'),
      );

      await expect(
        service.createVisaCardOrder({
          programId: 1,
          noOfCards: 2,
          city: 'Amsterdam',
          postalCode: '1011AB',
          address: 'Damrak 1',
          addressee: 'John Doe',
          userId: 7,
        }),
      ).rejects.toThrow(HttpException);

      expect(cardOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should throw when saving a successful batch order fails', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [{ id: 123 }] as any,
      );
      programFspConfigurationRepository.getPropertiesByNamesOrThrow.mockResolvedValue(
        [
          { name: FspConfigurationProperties.brandCode, value: 'BRAND' },
          {
            name: FspConfigurationProperties.coverLetterCode,
            value: 'COVER_LETTER',
          },
          {
            name: FspConfigurationProperties.cardDistributionByMail,
            value: true,
          },
        ] as any,
      );

      intersolveVisaService.issueTokenAndCreatePhysicalCard.mockResolvedValue();
      cardOrderRepository.save.mockRejectedValue(new Error('db down'));

      await expect(
        service.createVisaCardOrder({
          programId: 1,
          noOfCards: 1,
          city: 'Amsterdam',
          postalCode: '1011AB',
          address: 'Damrak 1',
          addressee: 'John Doe',
          userId: 7,
        }),
      ).rejects.toThrow(
        new HttpException(
          'Cards were ordered, but saving the batch record failed. Please contact support for reconciliation.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should throw when address does not include a house number', async () => {
      await expect(
        service.createVisaCardOrder({
          programId: 1,
          noOfCards: 1,
          city: 'Amsterdam',
          postalCode: '1011AB',
          address: 'Damrak',
          addressee: 'John Doe',
          userId: 7,
        }),
      ).rejects.toThrow(
        new HttpException(
          'Address must include street name and house number.',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(
        intersolveVisaService.issueTokenAndCreatePhysicalCard,
      ).not.toHaveBeenCalled();
    });

    it('should return mapped orders sorted by requested criteria', async () => {
      const queryBuilder = {} as any;
      cardOrderRepository.createQueryBuilderForProgram.mockReturnValue(
        queryBuilder,
      );

      (paginate as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 42,
            noOfCardsOrdered: 5,
            addressee: 'John Doe',
            address: 'Damrak 1 A',
            postalCode: '1011AB',
            city: 'Amsterdam',
            userId: 7,
            user: { username: 'manager@example.org' },
            created: new Date('2026-05-26T08:30:00.000Z'),
          },
        ],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
        links: {
          first: '',
          previous: '',
          current: '',
          next: '',
          last: '',
        },
      });

      const result = await service.getVisaCardOrders({
        programId: 1,
        paginateQuery: {
          path: '',
          sortBy: [['noOfCardsOrdered', 'ASC']],
        },
      });

      expect(cardOrderRepository.createQueryBuilderForProgram).toHaveBeenCalledWith({
        programId: 1,
      });
      expect(paginate).toHaveBeenCalled();
      expect(result).toEqual({
        data: [
          {
            id: 42,
            noOfCardsOrdered: 5,
            address: 'John Doe, Damrak 1 A, 1011AB, Amsterdam',
            orderedByUsername: 'manager@example.org',
            created: new Date('2026-05-26T08:30:00.000Z'),
          },
        ],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
        links: {
          first: '',
          previous: '',
          current: '',
          next: '',
          last: '',
        },
      });
    });

    it('should handle maximum batch of 700 cards', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [{ id: 123 }] as any,
      );
      programFspConfigurationRepository.getPropertiesByNamesOrThrow.mockResolvedValue(
        [
          { name: FspConfigurationProperties.brandCode, value: 'BRAND' },
          {
            name: FspConfigurationProperties.coverLetterCode,
            value: 'COVER_LETTER',
          },
          {
            name: FspConfigurationProperties.cardDistributionByMail,
            value: true,
          },
        ] as any,
      );

      // Mock successful creation for all 700 cards
      intersolveVisaService.issueTokenAndCreatePhysicalCard.mockResolvedValue();

      const result = await service.createVisaCardOrder({
        programId: 1,
        noOfCards: 700,
        city: 'Amsterdam',
        postalCode: '1011AB',
        address: 'Damrak 1 A',
        addressee: 'John Doe',
        userId: 7,
      });

      // Verify API was called 700 times
      expect(
        intersolveVisaService.issueTokenAndCreatePhysicalCard,
      ).toHaveBeenCalledTimes(700);

      // Verify all 700 were ordered successfully
      expect(result).toEqual({
        noOfCardsSent: 700,
        noOfCardsOrdered: 700,
      });

      // Verify batch was persisted
      expect(cardOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          noOfCards: 700,
          noOfCardsOrdered: 700,
          programId: 1,
          userId: 7,
          city: 'Amsterdam',
          postalCode: '1011AB',
          address: 'Damrak 1 A',
          addressee: 'John Doe',
        }),
      );
      expect(cardOrderRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failure at max batch of 700 cards', async () => {
      programFspConfigurationRepository.getByProgramIdAndFspName.mockResolvedValue(
        [{ id: 123 }] as any,
      );
      programFspConfigurationRepository.getPropertiesByNamesOrThrow.mockResolvedValue(
        [
          { name: FspConfigurationProperties.brandCode, value: 'BRAND' },
          {
            name: FspConfigurationProperties.coverLetterCode,
            value: 'COVER_LETTER',
          },
          {
            name: FspConfigurationProperties.cardDistributionByMail,
            value: true,
          },
        ] as any,
      );

      // Mock: 699 succeed, every 100th card fails (so 7 fail total at indices: 99, 199, 299, 399, 499, 599, 699)
      const mockImpl = jest.fn().mockImplementation(() => {
        const callCount = mockImpl.mock.calls.length;
        if (callCount % 100 === 0) {
          return Promise.reject(
            new IntersolveVisaApiError('temporary network error'),
          );
        }
        return Promise.resolve();
      });
      intersolveVisaService.issueTokenAndCreatePhysicalCard = mockImpl;

      const result = await service.createVisaCardOrder({
        programId: 1,
        noOfCards: 700,
        city: 'Amsterdam',
        postalCode: '1011AB',
        address: 'Damrak 1 A',
        addressee: 'John Doe',
        userId: 7,
      });

      // Verify API was called 700 times
      expect(mockImpl).toHaveBeenCalledTimes(700);

      // Verify 693 succeeded (700 - 7 failures)
      expect(result).toEqual({
        noOfCardsSent: 700,
        noOfCardsOrdered: 693,
      });

      // Verify batch was persisted with partial count
      expect(cardOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          noOfCards: 700,
          noOfCardsOrdered: 693,
        }),
      );
    });
  });
});
