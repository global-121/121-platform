import { Injectable } from '@nestjs/common';
import { In, IsNull, Not } from 'typeorm';

import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';

@Injectable()
export class NedbankReconciliationService {
  public constructor(
    private readonly nedbankService: NedbankService,
    private readonly nedbankVoucherScopedRepository: NedbankVoucherScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
  ) {}

  public async doNedbankReconciliation(): Promise<void> {
    const voucherReferences = await this.nedbankVoucherScopedRepository.find({
      select: ['orderCreateReference', 'transactionId'],
      where: [
        { status: IsNull() },
        {
          status: Not(
            In([
              NedbankVoucherStatus.REDEEMED,
              NedbankVoucherStatus.REFUNDED,
              NedbankVoucherStatus.FAILED,
            ]),
          ),
        },
      ],
    });

    for (const voucherReference of voucherReferences) {
      await this.reconcileVoucherAndTransaction(voucherReference);
    }
  }

  private async reconcileVoucherAndTransaction({
    orderCreateReference,
    transactionId,
  }: {
    orderCreateReference: string;
    transactionId: number;
  }): Promise<void> {
    const voucherInfo =
      await this.nedbankService.retrieveVoucherInfo(orderCreateReference);
    const voucherStatus = voucherInfo.status;

    if (!voucherStatus) {
      // If no status is returned, we don't update the voucher status or transaction status
      return;
    }

    await this.nedbankVoucherScopedRepository.update(
      { orderCreateReference },
      { status: voucherStatus },
    );

    const newTransactionStatus =
      this.mapVoucherStatusToNewTransactionStatus(voucherStatus);

    if (!newTransactionStatus) {
      return;
    }

    let errorMessage: string | undefined;
    if (newTransactionStatus === TransactionStatusEnum.error) {
      errorMessage = await this.createTransactionErrorMessage(
        voucherStatus,
        voucherInfo.errorMessage,
        voucherInfo.errorCode,
      );
    }
    await this.transactionScopedRepository.update(
      { id: transactionId },
      { status: newTransactionStatus, errorMessage },
    );
  }

  private mapVoucherStatusToNewTransactionStatus(
    voucherStatus: NedbankVoucherStatus | undefined,
  ): TransactionStatusEnum | undefined {
    switch (voucherStatus) {
      case NedbankVoucherStatus.REDEEMED:
        return TransactionStatusEnum.success;

      case NedbankVoucherStatus.REFUNDED:
      case NedbankVoucherStatus.FAILED:
        return TransactionStatusEnum.error;

      default:
        // If another voucher status or undefined is returned, we don't update the transaction status or voucher status
        return undefined;
    }
  }

  private async createTransactionErrorMessage(
    voucherStatus: NedbankVoucherStatus,
    errorMessage?: string,
    errorCode?: string,
  ): Promise<string | undefined> {
    if (voucherStatus === NedbankVoucherStatus.REFUNDED) {
      return 'Voucher has been refunded by Nedbank. If you retry this transfer, the person will receive a new voucher.';
    }
    if (errorCode === NedbankErrorCode.voucherNotFound) {
      return 'Nedbank voucher was not found, something went wrong when creating the voucher. Please retry the transfer.';
    }
    // There is no specific error message for tooManyRequestsForThisVoucher
    // As the transaction will stay on waiting status so the user will never see the error message
    if (errorCode === NedbankErrorCode.genericApiError) {
      return errorMessage;
    }
  }
}
