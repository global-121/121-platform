import { Test, TestingModule } from '@nestjs/testing';
import { UpdateResult } from 'typeorm';

import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';
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

    it('should throw an error if phone number does not start with 27', async () => {
      const amount = 200;
      const invalidPhoneNumber = '12345678901'; // Invalid phone number

      await expect(
        service.createVoucher({
          transferAmount: amount,
          phoneNumber: invalidPhoneNumber,
          orderCreateReference,
          paymentReference,
        }),
      ).rejects.toThrow('Phone number must start with 27');
    });

    it('should throw an error if phone number length is not 11', async () => {
      const amount = 200;
      const invalidPhoneNumber = '2712345678'; // Invalid phone number length

      await expect(
        service.createVoucher({
          transferAmount: amount,
          phoneNumber: invalidPhoneNumber,
          orderCreateReference,
          paymentReference,
        }),
      ).rejects.toThrow('Phone number must be 11 numbers long (including 27)');
    });
  });

  describe('retrieveVoucherInfo', () => {
    it('should retrieve voucher info successfully', async () => {
      jest
        .spyOn(apiService, 'getOrderByOrderCreateReference')
        .mockResolvedValue(NedbankVoucherStatus.REDEEMABLE);
      jest
        .spyOn(voucherRepository, 'update')
        .mockResolvedValue({} as UpdateResult);

      const result = await service.retrieveVoucherInfo(orderCreateReference);

      expect(result).toMatchObject({
        status: NedbankVoucherStatus.REDEEMABLE,
        errorMessage: undefined,
      });
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
    });

    it('should return a voucher status and specific error message on an error with code NBApimResourceNotFound', async () => {
      const error = new NedbankError('Resource not found');
      error.code = NedbankErrorCode.NBApimResourceNotFound;

      jest
        .spyOn(apiService, 'getOrderByOrderCreateReference')
        .mockRejectedValue(error);

      const result = await service.retrieveVoucherInfo(orderCreateReference);

      expect(result.status).toBe(NedbankVoucherStatus.FAILED);
      expect(result.errorMessage).toMatchSnapshot();
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
    });

    it('should return the error message and a voucher status on a Nedbank error', async () => {
      const error = new NedbankError('General error');
      error.code = 'SomeOtherErrorCode';

      jest
        .spyOn(apiService, 'getOrderByOrderCreateReference')
        .mockRejectedValue(error);

      const result = await service.retrieveVoucherInfo(orderCreateReference);

      expect(result).toMatchObject({
        status: NedbankVoucherStatus.FAILED,
        errorMessage: 'General error',
      });
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
    });
  });
});
