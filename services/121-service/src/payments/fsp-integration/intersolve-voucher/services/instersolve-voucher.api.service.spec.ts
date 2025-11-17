import { Test, TestingModule } from '@nestjs/testing';

import { env } from '@121-service/src/env';
import { IntersolveVoucherMockService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/instersolve-voucher.mock';
import { IntersolveVoucherApiService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/instersolve-voucher.api.service';
import { SoapService } from '@121-service/src/utils/soap/soap.service';

describe('IntersolveVoucherApiService', () => {
  let service: IntersolveVoucherApiService;
  let soapService: SoapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntersolveVoucherApiService,
        {
          provide: SoapService,
          useValue: {
            post: jest.fn(),
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
          useValue: {
            save: jest.fn(),
            findOneByOrFail: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get<IntersolveVoucherApiService>(
      IntersolveVoucherApiService,
    );
    soapService = module.get<SoapService>(SoapService);
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

  Object.defineProperty(env, 'MOCK_INTERSOLVE', { value: false });

  it('should return result on first success', async () => {
    (soapService.post as jest.Mock).mockResolvedValueOnce(validResponse);
    const result = await service.getCard('card', 'pin', 'user', 'pass');
    expect(result).toEqual({
      resultCode: '0',
      resultDescription: 'OK',
      status: 'Active',
      balance: 1000,
      balanceFactor: 100,
    });
    expect(soapService.post).toHaveBeenCalledTimes(1);
  });

  it('should retry once and succeed on second try', async () => {
    (soapService.post as jest.Mock)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(validResponse);
    const result = await service.getCard('card', 'pin', 'user', 'pass');
    expect(result.resultCode).toBe('0');
    expect(soapService.post).toHaveBeenCalledTimes(2);
  });

  it('should throw error after two failed attempts', async () => {
    (soapService.post as jest.Mock).mockResolvedValue({});
    await expect(
      service.getCard('card', 'pin', 'user', 'pass'),
    ).rejects.toThrow(/GetCardResponse/);
    expect(soapService.post).toHaveBeenCalledTimes(2);
  });

  it('should throw error if missing ResultCode', async () => {
    (soapService.post as jest.Mock)
      .mockResolvedValueOnce({ GetCardResponse: {} })
      .mockResolvedValueOnce({ GetCardResponse: {} });
    await expect(
      service.getCard('card', 'pin', 'user', 'pass'),
    ).rejects.toThrow(/ResultCode/);
  });
});
