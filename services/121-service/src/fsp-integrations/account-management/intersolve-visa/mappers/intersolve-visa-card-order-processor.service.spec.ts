import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaCardOrderProcessorService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/mappers/intersolve-visa-card-order-processor.service';
import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';
import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaCardOrderRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-card-order.repository';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';

describe('IntersolveVisaCardOrderProcessorService', () => {
  let service: IntersolveVisaCardOrderProcessorService;
  let intersolveVisaService: jest.Mocked<IntersolveVisaService>;
  let cardOrderRepository: jest.Mocked<IntersolveVisaCardOrderRepository>;

  function createOrderEntity(
    overrides: Partial<VisaCardOrderEntity> = {},
  ): VisaCardOrderEntity {
    return Object.assign(new VisaCardOrderEntity(), {
      id: 1,
      noOfCards: 1,
      noOfCardsOrdered: 0,
      status: VisaCardOrderStatus.Processing,
      addressee: 'John Doe',
      addressStreet: 'Damrak',
      addressHouseNumber: '1',
      addressHouseNumberAddition: 'A',
      addressPostalCode: '1011AB',
      addressCity: 'Amsterdam',
      ...overrides,
    });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntersolveVisaCardOrderProcessorService,
        {
          provide: IntersolveVisaService,
          useValue: {
            issueTokenAndCreatePhysicalCard: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaCardOrderRepository,
          useValue: {
            updateProgress: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(IntersolveVisaCardOrderProcessorService);
    intersolveVisaService = module.get(IntersolveVisaService);
    cardOrderRepository = module.get(
      IntersolveVisaCardOrderRepository,
    ) as jest.Mocked<IntersolveVisaCardOrderRepository>;
  });

  it('completes the order when all card requests fail with IntersolveVisaApiError', async () => {
    intersolveVisaService.issueTokenAndCreatePhysicalCard.mockRejectedValue(
      new IntersolveVisaApiError('api error'),
    );

    await expect(
      service.processCardOrder({
        order: createOrderEntity({ noOfCards: 2 }),
        brandCode: 'BRAND',
        coverLetterCode: 'COVER_LETTER',
      }),
    ).resolves.toBeUndefined();

    expect(cardOrderRepository.updateProgress).not.toHaveBeenCalled();
    expect(cardOrderRepository.updateStatus).toHaveBeenCalledWith({
      orderId: 1,
      status: VisaCardOrderStatus.Completed,
    });
  });

  it('re-throws unexpected errors from issueTokenAndCreatePhysicalCard', async () => {
    intersolveVisaService.issueTokenAndCreatePhysicalCard.mockRejectedValue(
      new Error('unexpected'),
    );

    await expect(
      service.processCardOrder({
        order: createOrderEntity(),
        brandCode: 'BRAND',
        coverLetterCode: 'COVER_LETTER',
      }),
    ).rejects.toThrow('unexpected');
  });

  it('updates progress for successful cards and completes the order', async () => {
    intersolveVisaService.issueTokenAndCreatePhysicalCard
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new IntersolveVisaApiError('temporary error'))
      .mockResolvedValueOnce();

    await service.processCardOrder({
      order: createOrderEntity({ noOfCards: 3 }),
      brandCode: 'BRAND',
      coverLetterCode: 'COVER_LETTER',
    });

    expect(cardOrderRepository.updateProgress).toHaveBeenNthCalledWith(1, {
      orderId: 1,
      noOfCardsOrdered: 1,
    });
    expect(cardOrderRepository.updateProgress).toHaveBeenNthCalledWith(2, {
      orderId: 1,
      noOfCardsOrdered: 2,
    });
    expect(cardOrderRepository.updateStatus).toHaveBeenCalledWith({
      orderId: 1,
      status: VisaCardOrderStatus.Completed,
    });
  });
});
