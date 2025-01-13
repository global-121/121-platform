import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError as NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankCreateOrderParams } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-create-order-params';
import { NedbankCreateOrderReturn } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-create-order-return';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-api.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { generateUUIDFromSeed } from '@121-service/src/payments/payments.helpers';

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

  public async createOrder({
    transferAmount,
    phoneNumber,
    transactionReference,
  }: NedbankCreateOrderParams): Promise<NedbankCreateOrderReturn> {
    const isAmountMultipleOf10 =
      this.isCashoutAmountMultipleOf10(transferAmount);
    if (!isAmountMultipleOf10) {
      throw new NedbankError('Amount must be a multiple of 10');
    }
    const maxAmount = 5000;
    if (transferAmount >= maxAmount) {
      // ##TODO: If check here for 5000 and Nebank changes the max amount we need to change it here as well
      // How often would it happen that user try to cashout more than 5000? So how valuable is it that we maintain this check?
      throw new NedbankError(
        `Amount must be equal or less than ${maxAmount}, got ${transferAmount}`,
      );
    }

    // ##TODO Find a way to properly cover this with a test to ensure this keeps working if we refactor transactions to have one per payment
    // I wanted to use a deterministic UUID for the orderCreateReference (so use uuid v5 instead of v4)
    // However nedbank has a check in place to check if the orderCreateReference has 4 in the 15th position (which is uuid v4)
    // So I made some code to replace the 5 with a 4 which does work but feels a bit hacky
    // Not sure if this is the best way to go about it
    // However it seems very useful to have a deterministic UUID for the orderCreateReference so you can gerenate the same orderCreateReference for the same transaction
    // So if for some reason you trigger the same payment twice the second time you can just use the same orderCreateReference
    const orderCreateReference = generateUUIDFromSeed(
      transactionReference,
    ).replace(/^(.{14})5/, '$14');

    const cashoutResult = await this.nedbankApiService.createOrder({
      transferAmount,
      phoneNumber,
      orderCreateReference,
    });
    return {
      orderCreateReference,
      nedbankVoucherStatus: cashoutResult.Data.Status,
    };
  }

  public async storeVoucher({
    // Should this function live in the repository only?
    orderCreateReference,
    voucherStatus,
    transactionId,
  }: {
    orderCreateReference: string;
    voucherStatus: NedbankVoucherStatus;
    transactionId: number;
  }): Promise<void> {
    const nedbankVoucherEntity = this.nedbankVoucherScopedRepository.create({
      orderCreateReference,
      status: voucherStatus,
      transactionId,
    });
    await this.nedbankVoucherScopedRepository.save(nedbankVoucherEntity);
  }

  public async retrieveAndUpdateVoucherStatus(
    orderCreateReference: string,
    voucherId: number,
  ): Promise<NedbankVoucherStatus> {
    const getOrderReponseBody =
      await this.nedbankApiService.getOrder(orderCreateReference);

    // ##TODO: How to mock if another response comes back than status REDEEMABLE from the sandbox?
    const voucherResponse = getOrderReponseBody.Data.Transactions.Voucher;

    await this.nedbankVoucherScopedRepository.update(
      { id: voucherId },
      { status: voucherResponse.Status },
    );
    return voucherResponse.Status;
  }

  private isCashoutAmountMultipleOf10(amount: number): boolean {
    return amount % 10 === 0;
  }
}
