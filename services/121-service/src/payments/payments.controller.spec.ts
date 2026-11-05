import { TestBed } from '@automock/jest';
import { ForbiddenException } from '@nestjs/common';
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

  describe('transaction export', () => {
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

      it(`should throw FORBIDDEN when user lacks ${PermissionEnum.RegistrationPaymentExport} permission`, async () => {
        // Arrange
        mockUserPermissions({
          permissions: [PermissionEnum.PaymentTransactionREAD],
        });

        // Act & Assert
        await expect(
          controller.exportTransactionsUsingDateFilter(
            mockRequest,
            mockResponse,
            programId,
            query,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it(`should successfully send XLSX when user has ${PermissionEnum.RegistrationPaymentExport} permission`, async () => {
        // Arrange
        mockUserPermissions({
          permissions: [PermissionEnum.RegistrationPaymentExport],
        });

        // Act
        await controller.exportTransactionsUsingDateFilter(
          mockRequest,
          mockResponse,
          programId,
          query,
        );

        // Assert
        expect(sendXlsxReponse).toHaveBeenCalledWith(
          exportResult.data,
          exportResult.fileName,
          mockResponse,
        );
      });
    });

    describe.each([
      {
        formatDescription: 'json',
        query: { format: ExportFileFormat.json },
      },
      {
        formatDescription: 'not specified',
        query: {},
      },
    ])('when format is $formatDescription', ({ query }) => {
      it(`should throw FORBIDDEN when user lacks ${PermissionEnum.PaymentTransactionREAD} permission`, async () => {
        // Arrange
        mockUserPermissions({
          permissions: [PermissionEnum.RegistrationPaymentExport],
        });

        // Act & Assert
        await expect(
          controller.exportTransactionsUsingDateFilter(
            mockRequest,
            mockResponse,
            programId,
            query,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it(`should successfully send JSON when user has ${PermissionEnum.PaymentTransactionREAD} permission`, async () => {
        // Arrange
        mockUserPermissions({
          permissions: [PermissionEnum.PaymentTransactionREAD],
        });

        // Act
        await controller.exportTransactionsUsingDateFilter(
          mockRequest,
          mockResponse,
          programId,
          query,
        );

        // Assert
        expect(mockResponse.send).toHaveBeenCalledWith(exportResult);
      });
    });

    function mockUserPermissions({
      permissions,
    }: {
      permissions: PermissionEnum[];
    }): void {
      userService.canActivate.mockImplementation(
        async (requiredPermissions) =>
          requiredPermissions.length > 0 &&
          requiredPermissions.every((permission) =>
            permissions.includes(permission),
          ),
      );
    }
  });
});
