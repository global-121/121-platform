import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';
import { PaymentsController } from '@121-service/src/payments/payments.controller';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { GetTransactionsQueryDto } from '@121-service/src/payments/transactions/dto/get-transaction-query.dto';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';
import { sendXlsxReponse } from '@121-service/src/utils/send-xlsx-response';

jest.mock('@121-service/src/utils/send-xlsx-response', () => ({
  sendXlsxReponse: jest.fn(),
}));

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let userService: jest.Mocked<UserService>;
  let paymentsReportingService: jest.Mocked<PaymentsReportingService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(PaymentsController).compile();

    controller = unit;
    userService = unitRef.get(UserService);
    paymentsReportingService = unitRef.get(PaymentsReportingService);
  });

  describe('exportTransactionsUsingDateFilter', () => {
    const programId = 1;
    const mockRequest = {
      user: {
        id: 42,
      },
    } as unknown as ScopedUserRequest;

    const mockResponse = {
      send: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as Response;

    const exportResult = {
      data: [{ id: 1 }],
      fileName: 'transactions.xlsx',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      paymentsReportingService.exportTransactionsUsingDateFilter.mockResolvedValue(
        exportResult,
      );
    });

    describe('when format is xlsx', () => {
      const query: GetTransactionsQueryDto = {
        format: ExportFileFormat.xlsx,
      };

      it('should throw FORBIDDEN when user lacks RegistrationPaymentExport permission', async () => {
        userService.canActivate.mockImplementation(
          async (permissions) =>
            !permissions.includes(PermissionEnum.RegistrationPaymentExport),
        );

        await expect(
          controller.exportTransactionsUsingDateFilter(
            mockRequest,
            mockResponse,
            programId,
            query,
          ),
        ).rejects.toThrow(new HttpException('Forbidden', HttpStatus.FORBIDDEN));
      });

      it('should successfully send XLSX when user has RegistrationPaymentExport permission', async () => {
        userService.canActivate.mockImplementation(async (permissions) =>
          permissions.includes(PermissionEnum.RegistrationPaymentExport),
        );

        await controller.exportTransactionsUsingDateFilter(
          mockRequest,
          mockResponse,
          programId,
          query,
        );

        expect(sendXlsxReponse).toHaveBeenCalledWith(
          exportResult.data,
          exportResult.fileName,
          mockResponse,
        );
      });
    });

    describe('when format is json (default)', () => {
      const query: GetTransactionsQueryDto = {
        format: ExportFileFormat.json,
      };

      it('should throw FORBIDDEN when user lacks PaymentTransactionREAD permission', async () => {
        userService.canActivate.mockImplementation(
          async (permissions) =>
            !permissions.includes(PermissionEnum.PaymentTransactionREAD),
        );

        await expect(
          controller.exportTransactionsUsingDateFilter(
            mockRequest,
            mockResponse,
            programId,
            query,
          ),
        ).rejects.toThrow(new HttpException('Forbidden', HttpStatus.FORBIDDEN));
      });

      it('should successfully send JSON when user has PaymentTransactionREAD permission', async () => {
        userService.canActivate.mockImplementation(async (permissions) =>
          permissions.includes(PermissionEnum.PaymentTransactionREAD),
        );

        await controller.exportTransactionsUsingDateFilter(
          mockRequest,
          mockResponse,
          programId,
          query,
        );

        expect(mockResponse.send).toHaveBeenCalledWith(exportResult);
      });
    });
  });
});
