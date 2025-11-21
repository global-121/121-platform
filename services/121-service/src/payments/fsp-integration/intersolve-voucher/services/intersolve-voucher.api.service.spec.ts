import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVoucherMockService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.mock';
import { IntersolveVoucherApiService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.api.service';
import { SoapService } from '@121-service/src/utils/soap/soap.service';

describe('IntersolveVoucherApiService', () => {
  let service: IntersolveVoucherApiService;
  let intersolveVoucherMockService: IntersolveVoucherMockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntersolveVoucherApiService,
        {
          provide: SoapService,
          useValue: {
            readXmlAsJs: jest.fn().mockResolvedValue({}),
            changeSoapBody: jest.fn((p) => p),
          },
        },
        {
          provide: IntersolveVoucherMockService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: 'IntersolveIssueVoucherRequestEntityRepository',
          useValue: {},
        },
      ],
    }).compile();
    service = module.get<IntersolveVoucherApiService>(
      IntersolveVoucherApiService,
    );
    intersolveVoucherMockService = module.get<IntersolveVoucherMockService>(
      IntersolveVoucherMockService,
    );
  });

  const validResponse = {
    GetCardResponse: {
      ResultCode: { _text: '0' },
      ResultDescription: { _text: 'OK' },
      Card: {
        Status: { _text: 'Active' },
        Balance: { _text: '1000' },
        BalanceFactor: { _text: '100' },
      },
    },
  };

  it('should return result on first success', async () => {
    (intersolveVoucherMockService.post as jest.Mock).mockResolvedValueOnce(
      validResponse,
    );
    const result = await service.getCard('card', 'pin', 'user', 'pass');
    expect(result).toEqual({
      resultCode: '0',
      resultDescription: 'OK',
      status: 'Active',
      balance: 1000,
      balanceFactor: 100,
    });
    expect(intersolveVoucherMockService.post).toHaveBeenCalledTimes(1);
  });

  it('should retry once and succeed on second try', async () => {
    (intersolveVoucherMockService.post as jest.Mock)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(validResponse);
    const result = await service.getCard('card', 'pin', 'user', 'pass');
    expect(result.resultCode).toBe('0');
    expect(intersolveVoucherMockService.post).toHaveBeenCalledTimes(2);
  });

  it('should throw error after two failed attempts', async () => {
    (intersolveVoucherMockService.post as jest.Mock).mockResolvedValue({});
    await expect(
      service.getCard('card', 'pin', 'user', 'pass'),
    ).rejects.toThrowErrorMatchingSnapshot();
    expect(intersolveVoucherMockService.post).toHaveBeenCalledTimes(2);
  });
});
