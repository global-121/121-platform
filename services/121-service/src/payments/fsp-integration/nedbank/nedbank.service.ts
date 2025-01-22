import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankCreateVoucherParams } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-create-voucher-params';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank-api.service';

@Injectable()
export class NedbankService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly nedbankApiService: NedbankApiService,
    private readonly nedbankVoucherScopedRepository: NedbankVoucherScopedRepository,
  ) {}

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

    return await this.nedbankApiService.createOrder({
      transferAmount,
      phoneNumber,
      orderCreateReference,
      paymentReference,
    });
  }

  public async retrieveAndUpdateVoucherStatus(
    orderCreateReference: string,
  ): Promise<NedbankVoucherStatus> {
    let voucherStatus: NedbankVoucherStatus;
    try {
      voucherStatus =
        await this.nedbankApiService.getOrderByOrderCreateReference(
          orderCreateReference,
        );
    } catch (error) {
      if (
        error instanceof NedbankError &&
        error.code === NedbankErrorCode.NBApimResourceNotFound // Should we abstract this error code to a 121 error code?
      ) {
        // This condition handles the specific case where the voucher was never created in.
        // This situation can occur if:
        // 1. The server crashed during the transaction job before the voucher was created.
        // 2. We never received a response from Nedbank when creating the voucher.
        // In this case, we update the transaction status to 'error' so that the user can retry the transfer.
        voucherStatus = NedbankVoucherStatus.FAILED;
      } else {
        throw error;
      }
    }

    await this.nedbankVoucherScopedRepository.update(
      { orderCreateReference },
      { status: voucherStatus },
    );
    return voucherStatus;
  }
}
