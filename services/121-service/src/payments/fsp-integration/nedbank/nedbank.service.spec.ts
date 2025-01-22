import { Test, TestingModule } from '@nestjs/testing';
import { UpdateResult } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank-api.service';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const orderCreateReference = `mock-uuid`;
const paymentReference = `pj1-pay1-00270000000`;

describe('NedbankService', () => {
  let service: NedbankService;
  let apiService: NedbankApiService;
  let voucherRepository: NedbankVoucherScopedRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NedbankService,
        {
          provide: NedbankApiService,
          useValue: {
            createOrder: jest.fn(),
            getOrderByOrderCreateReference: jest.fn(),
          },
        },
        {
          provide: NedbankVoucherScopedRepository,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NedbankService>(NedbankService);
    apiService = module.get<NedbankApiService>(NedbankApiService);
    voucherRepository = module.get<NedbankVoucherScopedRepository>(
      NedbankVoucherScopedRepository,
    );
  });

  describe('createVoucher', () => {
    it('should create a voucher successfully', async () => {
      const amount = 200;
      jest
        .spyOn(apiService, 'createOrder')
        .mockResolvedValue(NedbankVoucherStatus.PENDING);

      const result = await service.createVoucher({
        transferAmount: amount,
        phoneNumber: registrationNedbank.phoneNumber,
        orderCreateReference,
        paymentReference,
      });

      expect(result).toEqual(NedbankVoucherStatus.PENDING);

      expect(apiService.createOrder).toHaveBeenCalledWith({
        transferAmount: amount,
        phoneNumber: registrationNedbank.phoneNumber,
        orderCreateReference,
        paymentReference,
      });
    });

    it('should throw an error if amount is not a multiple of 10', async () => {
      const amount = 25;
      await expect(
        service.createVoucher({
          transferAmount: amount, // Not a multiple of 10
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReference,
          paymentReference,
        }),
      ).rejects.toThrow(NedbankError);

      await expect(
        service.createVoucher({
          transferAmount: amount, // Not a multiple of 10
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReference,
          paymentReference,
        }),
      ).rejects.toThrow('Amount must be a multiple of 10');

      expect(apiService.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('retrieveAndUpdateVoucherStatus', () => {
    it('should retrieve and update voucher status successfully', async () => {
      jest
        .spyOn(apiService, 'getOrderByOrderCreateReference')
        .mockResolvedValue(NedbankVoucherStatus.REDEEMABLE);
      jest
        .spyOn(voucherRepository, 'update')
        .mockResolvedValue({} as UpdateResult);

      const result =
        await service.retrieveAndUpdateVoucherStatus(orderCreateReference);

      expect(result).toBe(NedbankVoucherStatus.REDEEMABLE);
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
      expect(voucherRepository.update).toHaveBeenCalledWith(
        { orderCreateReference },
        { status: NedbankVoucherStatus.REDEEMABLE },
      );
    });
  });
});
