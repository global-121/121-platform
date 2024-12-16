import { Test, TestingModule } from '@nestjs/testing';
import { UpdateResult } from 'typeorm';

import { NedbankCreateOrderResponseDto } from '@121-service/src/payments/fsp-integration/nedbank/dto/nedbank-create-order-response.dto';
import { NedbankGetOrderResponseDto } from '@121-service/src/payments/fsp-integration/nedbank/dto/nedbank-get-order-reponse.dto';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-api.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { generateUUIDFromSeed } from '@121-service/src/payments/payments.helpers';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const transactionReference = 'transaction123';

jest.mock('./nedbank-api.service');
jest.mock('./repositories/nedbank-voucher.scoped.repository');
jest.mock('@121-service/src/payments/payments.helpers');

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
            getOrder: jest.fn(),
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

      const response: NedbankCreateOrderResponseDto = {
        Data: {
          OrderId: 'orderId',
          Status: NedbankVoucherStatus.PENDING,
        },
        Links: {
          Self: '',
        },
        Meta: {},
      };

      jest.spyOn(apiService, 'createOrder').mockResolvedValue(response);

      const result = await service.createOrder({
        transferAmount: amount,
        fullName: registrationNedbank.fullName,
        idNumber: registrationNedbank.nationalId,
        transactionReference,
      });

      expect(result).toEqual({
        orderCreateReference: mockUUID.replace(/^(.{14})5/, '$14'),
        nedbankVoucherStatus: NedbankVoucherStatus.PENDING,
      });

      expect(apiService.createOrder).toHaveBeenCalledWith({
        transferAmount: amount,
        fullName: registrationNedbank.fullName,
        idNumber: registrationNedbank.nationalId,
        orderCreateReference: mockUUID.replace(/^(.{14})5/, '$14'),
      });
    });

    it('should throw an error if amount is not a multiple of 10', async () => {
      const amount = 25;
      await expect(
        service.createOrder({
          transferAmount: amount, // Not a multiple of 10
          fullName: registrationNedbank.fullName,
          idNumber: registrationNedbank.nationalId,
          transactionReference,
        }),
      ).rejects.toThrow(NedbankError);

      await expect(
        service.createOrder({
          transferAmount: amount, // Not a multiple of 10
          fullName: registrationNedbank.fullName,
          idNumber: registrationNedbank.nationalId,
          transactionReference,
        }),
      ).rejects.toThrow('Amount must be a multiple of 10');

      expect(apiService.createOrder).not.toHaveBeenCalled();
    });

    it('should throw an error if amount exceeds the maximum limit', async () => {
      await expect(
        service.createOrder({
          transferAmount: 6000, // Exceeds the maximum limit
          fullName: registrationNedbank.fullName,
          idNumber: registrationNedbank.nationalId,
          transactionReference,
        }),
      ).rejects.toThrow(NedbankError);

      await expect(
        service.createOrder({
          transferAmount: 6000, // Exceeds the maximum limit
          fullName: registrationNedbank.fullName,
          idNumber: registrationNedbank.nationalId,
          transactionReference,
        }),
      ).rejects.toThrow('Amount must be equal or less than 5000, got 6000');
      expect(apiService.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('retrieveAndUpdateVoucherStatus', () => {
    const getOrderResponse: NedbankGetOrderResponseDto = {
      Data: {
        Transactions: {
          Voucher: {
            Code: '',
            Status: NedbankVoucherStatus.REDEEMABLE,
            Redeem: {
              Redeemable: true,
              Redeemed: false,
              RedeemedOn: '',
              RedeemedAt: '',
            },
            Refund: {
              Refundable: true,
              Refunded: false,
              RefundedOn: '',
            },
            Pin: '',
          },
          PaymentReferenceNumber: '',
          OrderCreateReference: '',
          OrderDateTime: '',
          OrderExpiry: '',
        },
      },
      Links: {
        Self: '',
      },
      Meta: {},
    };

    it('should retrieve and update voucher status successfully', async () => {
      const orderCreateReference = 'orderCreateReference';
      const voucherId = 1;

      jest.spyOn(apiService, 'getOrder').mockResolvedValue(getOrderResponse);
      jest
        .spyOn(voucherRepository, 'update')
        .mockResolvedValue({} as UpdateResult);

      const result = await service.retrieveAndUpdateVoucherStatus(
        orderCreateReference,
        voucherId,
      );

      expect(result).toBe(NedbankVoucherStatus.REDEEMABLE);
      expect(apiService.getOrder).toHaveBeenCalledWith(orderCreateReference);
      expect(voucherRepository.update).toHaveBeenCalledWith(
        { id: voucherId },
        { status: NedbankVoucherStatus.REDEEMABLE },
      );
    });
  });
});
