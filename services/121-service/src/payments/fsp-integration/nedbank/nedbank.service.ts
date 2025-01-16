import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError as NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankCreateOrderParams } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-create-voucher-params';
import { NedbankCreateOrderReturnType } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-create-voucher-return-type';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-api.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

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
    orderCreateReferenceSeed,
  }: NedbankCreateOrderParams): Promise<NedbankCreateOrderReturnType> {
    const isAmountMultipleOf10 = transferAmount % 10 === 0;
    if (!isAmountMultipleOf10) {
      throw new NedbankError('Amount must be a multiple of 10');
    }

    // ##TODO Find a way to properly cover this with a test to ensure this keeps working if we refactor transactions to have one per payment
    // I wanted to use a deterministic UUID for the orderCreateReference (so use uuid v5 instead of v4)
    // However nedbank has a check in place to check if the orderCreateReference has 4 in the 15th position (which is uuid v4)
    // So I made some code to replace the 5 with a 4 which does work but feels a bit hacky
    // Not sure if this is the best way to go about it
    // However it seems very useful to have a deterministic UUID for the orderCreateReference so you can gerenate the same orderCreateReference for the same transaction
    // So if for some reason you trigger the same payment twice the second time you can just use the same orderCreateReference
    const orderCreateReference = generateUUIDFromSeed(
      orderCreateReferenceSeed,
    ).replace(/^(.{14})5/, '$14');

    const nedbankVoucherStatus = await this.nedbankApiService.createOrder({
      transferAmount,
      phoneNumber,
      orderCreateReference,
    });
    return {
      orderCreateReference,
      nedbankVoucherStatus,
    };
  }

  public async retrieveAndUpdateVoucherStatus(
    orderCreateReference: string,
    voucherId: number,
  ): Promise<NedbankVoucherStatus> {
    const voucherStatus =
      await this.nedbankApiService.getOrderByOrderCreateReference(
        orderCreateReference,
      );

    // ##TODO: How to mock if another response comes back than status REDEEMABLE from the sandbox?
    await this.nedbankVoucherScopedRepository.update(
      { id: voucherId },
      { status: voucherStatus },
    );
    return voucherStatus;
  }
}
