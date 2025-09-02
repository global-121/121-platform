import { Test, TestingModule } from '@nestjs/testing';
import { UpdateResult } from 'typeorm';

import { NedbankApiErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-api-error-code.enum';
import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankApiError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank-api.error';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank.service';
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

      let error: NedbankError | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.createVoucher({
          transferAmount: amount, // Not a multiple of 10
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReference,
          paymentReference,
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(NedbankError);
      expect(error.message).toMatchSnapshot();
      expect(apiService.createOrder).not.toHaveBeenCalled();
    });

    it('should throw an error if phone number does not start with South-Africa country code 27', async () => {
      const amount = 200;
      const invalidPhoneNumber = '12345678901'; // Invalid phone number

      let error: NedbankError | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.createVoucher({
          transferAmount: amount,
          phoneNumber: invalidPhoneNumber,
          orderCreateReference,
          paymentReference,
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(NedbankError);
      expect(error.message).toMatchSnapshot();
      expect(apiService.createOrder).not.toHaveBeenCalled();
    });

    it('should throw an error if phone number length is not 11', async () => {
      const amount = 200;
      const invalidPhoneNumber = '2712345678'; // Invalid phone number length

      let error: NedbankError | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.createVoucher({
          transferAmount: amount,
          phoneNumber: invalidPhoneNumber,
          orderCreateReference,
          paymentReference,
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(NedbankError);
      expect(error.message).toMatchSnapshot();
      expect(apiService.createOrder).not.toHaveBeenCalled();
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
      });
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
    });

    it('should return a voucher status and specific error code and message on a NBApimResourceNotFound api error', async () => {
      const error = new NedbankApiError('Resource not found');
      error.code = NedbankApiErrorCode.NBApimResourceNotFound;

      jest
        .spyOn(apiService, 'getOrderByOrderCreateReference')
        .mockRejectedValue(error);

      const result = await service.retrieveVoucherInfo(orderCreateReference);

      expect(result.errorCode).toBe(NedbankErrorCode.voucherNotFound);
      expect(result.status).toBe(NedbankVoucherStatus.FAILED);
      expect(result.errorMessage).toMatchSnapshot();
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
    });

    it('should not return a voucher status and specific error code and message on a NBApimTooManyRequestsError api error', async () => {
      const error = new NedbankApiError('Too many requests');
      error.code = NedbankApiErrorCode.NBApimTooManyRequestsError;

      jest
        .spyOn(apiService, 'getOrderByOrderCreateReference')
        .mockRejectedValue(error);

      const result = await service.retrieveVoucherInfo(orderCreateReference);

      expect(result.errorCode).toBe(
        NedbankErrorCode.tooManyRequestsForThisVoucher,
      );
      expect(result.status).toBeUndefined();
      expect(result.errorMessage).toMatchSnapshot();
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
    });

    it('should return the error message and a generic error code on a Nedbank Api error that is not specifically handled', async () => {
      const error = new NedbankApiError('General error');
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
