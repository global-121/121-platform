import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { NedbankApiErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-api-error-code.enum';
import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankApiError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank-api.error';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank-api.service';

@Injectable()
export class NedbankService implements FspIntegrationInterface {
  public constructor(private readonly nedbankApiService: NedbankApiService) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentId: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  public async createVoucher({
    transferAmount,
    phoneNumber,
    orderCreateReference,
    paymentReference,
  }: {
    transferAmount: number;
    phoneNumber: string;
    orderCreateReference: string;
    paymentReference: string;
  }): Promise<NedbankVoucherStatus> {
    const isAmountMultipleOf10 = transferAmount % 10 === 0;
    if (!isAmountMultipleOf10) {
      throw new NedbankError(
        'Amount must be a multiple of 10',
        NedbankErrorCode.invalidParameter,
      );
    }
    if (!phoneNumber.startsWith('27')) {
      throw new NedbankError(
        'Phone number must start with South-Africa country code: 27',
        NedbankErrorCode.invalidParameter,
      );
    }
    if (phoneNumber.length !== 11) {
      throw new NedbankError(
        'Phone number must be 11 numbers long (including 27 as country code)',
        NedbankErrorCode.invalidParameter,
      );
    }
    try {
      return await this.nedbankApiService.createOrder({
        transferAmount,
        phoneNumber,
        orderCreateReference,
        paymentReference,
      });
    } catch (error) {
      if (error instanceof NedbankApiError) {
        throw new NedbankError(error.message, NedbankErrorCode.genericApiError);
      }
      throw error;
    }
  }
  // TODO: REFACTOR: This method should not return an errorCode and errorMessage, but instead throw this error. However, this is not so straight-forward in handling business logic and probably requires introducing a NedbankOrderEntity besides NedbankVoucherEntity to keep track of orderCreateReference for orders that failed to create a voucher.
  public async retrieveVoucherInfo(orderCreateReference: string): Promise<{
    status?: NedbankVoucherStatus;
    errorMessage?: string;
    errorCode?: NedbankErrorCode;
  }> {
    try {
      const voucherStatus =
        await this.nedbankApiService.getOrderByOrderCreateReference(
          orderCreateReference,
        );

      return {
        status: voucherStatus,
      };
    } catch (error) {
      if (error instanceof NedbankApiError) {
        const errorMessage = error.message;

        if (error.code === NedbankApiErrorCode.NBApimResourceNotFound) {
          // This condition handles the specific case where the voucher was never created.
          // This situation can occur if:
          // 1. The server crashed during the transaction job before the voucher was created.
          // 2. We never received a response from Nedbank when creating the voucher.
          // In this case, we update the transaction status to 'error' so that the user can retry the transfer.
          return {
            status: NedbankVoucherStatus.FAILED,
            errorMessage,
            errorCode: NedbankErrorCode.voucherNotFound,
          };
        }
        if (error.code === NedbankApiErrorCode.NBApimTooManyRequestsError) {
          console.error(
            `Exceeded request limit to Nedbank for orderCreateReference: ${orderCreateReference}.
            Nedbank has a permanent counter for this limit, which will not reset unless we contact them.
            As a result, our system cannot determine the status of the voucher or the transaction.`,
          );
          // This error is thrown when we made too many requests to Nedbank.
          // In this case, we return a status of 'undefined' since we don't know the status of the voucher.
          return {
            status: undefined,
            errorMessage,
            errorCode: NedbankErrorCode.tooManyRequestsForThisVoucher,
          };
        }
        return {
          status: NedbankVoucherStatus.FAILED,
          errorMessage,
          errorCode: NedbankErrorCode.genericApiError,
        };
      } else {
        throw error;
      }
    }
  }
}
