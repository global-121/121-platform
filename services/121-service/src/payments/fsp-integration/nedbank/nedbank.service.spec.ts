import { Test, TestingModule } from '@nestjs/testing';
import { UpdateResult } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-api.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const orderCreateReferenceSeed = `ReferenceId=${registrationNedbank.referenceId},PaymentNumber=0,Attempt=0`;

jest.mock('./nedbank-api.service');
jest.mock('./repositories/nedbank-voucher.scoped.repository');
jest.mock('@121-service/src/utils/uuid.helpers');

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

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const amount = 200;

      const mockUUID = '12345678901234567890123456789012'; // Mock UUID
      (generateUUIDFromSeed as jest.Mock).mockReturnValue(mockUUID);

      jest
        .spyOn(apiService, 'createOrder')
        .mockResolvedValue(NedbankVoucherStatus.PENDING);

      const result = await service.createVoucher({
        transferAmount: amount,
        phoneNumber: registrationNedbank.phoneNumber,
        orderCreateReferenceSeed,
      });

      expect(result).toEqual({
        orderCreateReference: mockUUID.replace(/^(.{14})5/, '$14'),
        nedbankVoucherStatus: NedbankVoucherStatus.PENDING,
      });

      expect(apiService.createOrder).toHaveBeenCalledWith({
        transferAmount: amount,
        phoneNumber: registrationNedbank.phoneNumber,
        orderCreateReference: mockUUID.replace(/^(.{14})5/, '$14'),
      });
    });

    it('should throw an error if amount is not a multiple of 10', async () => {
      const amount = 25;
      await expect(
        service.createVoucher({
          transferAmount: amount, // Not a multiple of 10
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReferenceSeed,
        }),
      ).rejects.toThrow(NedbankError);

      await expect(
        service.createVoucher({
          transferAmount: amount, // Not a multiple of 10
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReferenceSeed,
        }),
      ).rejects.toThrow('Amount must be a multiple of 10');

      expect(apiService.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('retrieveAndUpdateVoucherStatus', () => {
    it('should retrieve and update voucher status successfully', async () => {
      const orderCreateReference = 'orderCreateReference';
      const voucherId = 1;

      jest
        .spyOn(apiService, 'getOrderByOrderCreateReference')
        .mockResolvedValue(NedbankVoucherStatus.REDEEMABLE);
      jest
        .spyOn(voucherRepository, 'update')
        .mockResolvedValue({} as UpdateResult);

      const result = await service.retrieveAndUpdateVoucherStatus(
        orderCreateReference,
        voucherId,
      );

      expect(result).toBe(NedbankVoucherStatus.REDEEMABLE);
      expect(apiService.getOrderByOrderCreateReference).toHaveBeenCalledWith(
        orderCreateReference,
      );
      expect(voucherRepository.update).toHaveBeenCalledWith(
        { id: voucherId },
        { status: NedbankVoucherStatus.REDEEMABLE },
      );
    });
  });
});
