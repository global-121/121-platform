import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankCreateVoucherParams } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-create-voucher-params';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank-api.service';

@Injectable()
export class NedbankService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(private readonly nedbankApiService: NedbankApiService) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  public async createVoucher({
    transferAmount,
    phoneNumber,
    orderCreateReference,
    paymentReference,
  }: NedbankCreateVoucherParams): Promise<NedbankVoucherStatus> {
    const isAmountMultipleOf10 = transferAmount % 10 === 0;
    if (!isAmountMultipleOf10) {
      throw new NedbankError('Amount must be a multiple of 10');
    }
    if (!phoneNumber.startsWith('27')) {
      throw new NedbankError('Phone number must start with 27');
    }
    if (phoneNumber.length !== 11) {
      throw new NedbankError(
        'Phone number must be 11 numbers long (including 27)',
      );
    }

    return await this.nedbankApiService.createOrder({
      transferAmount,
      phoneNumber,
      orderCreateReference,
      paymentReference,
    });
  }

  public async retrieveVoucherInfo(
    orderCreateReference: string,
  ): Promise<{ status: NedbankVoucherStatus; errorMessage?: string }> {
    try {
      const voucherStatus =
        await this.nedbankApiService.getOrderByOrderCreateReference(
          orderCreateReference,
        );

      let errorMessage: string | undefined;
      if (voucherStatus === NedbankVoucherStatus.REDEEMED) {
        errorMessage =
          'Voucher has been refunded by Nedbank. If you retry this transfer, the person will receive a new voucher.';
      }

      return {
        status: voucherStatus,
        errorMessage,
      };
    } catch (error) {
      if (error instanceof NedbankError) {
        // This condition handles the specific case where the voucher was never created.
        // This situation can occur if:
        // 1. The server crashed during the transaction job before the voucher was created.
        // 2. We never received a response from Nedbank when creating the voucher.
        // In this case, we update the transaction status to 'error' so that the user can retry the transfer.
        let errorMessage: string;
        if (error.code === NedbankErrorCode.NBApimResourceNotFound) {
          errorMessage =
            'Nedbank voucher was not found, something went wrong when creating the voucher. Please retry the transfer.';
        } else {
          errorMessage = error.message;
        }

        return {
          status: NedbankVoucherStatus.FAILED,
          errorMessage,
        };
      } else {
        throw error;
      }
    }
  }
}
