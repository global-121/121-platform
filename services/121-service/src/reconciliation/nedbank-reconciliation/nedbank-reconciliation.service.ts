import { Injectable } from '@nestjs/common';
import { In, IsNull, Not } from 'typeorm';

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
    const vouchers = await this.nedbankVoucherScopedRepository.find({
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

    for (const voucher of vouchers) {
      await this.reconciliateVoucherAndTransaction(voucher);
    }
  }

  private async reconciliateVoucherAndTransaction({
    orderCreateReference,
    transactionId,
  }: {
    orderCreateReference: string;
    transactionId: number;
  }): Promise<void> {
    const voucherInfo =
      await this.nedbankService.retrieveVoucherInfo(orderCreateReference);
    const voucherStatus = voucherInfo.status;

    await this.nedbankVoucherScopedRepository.update(
      { orderCreateReference },
      { status: voucherStatus },
    );

    let newTransactionStatus: TransactionStatusEnum | undefined;
    switch (voucherStatus) {
      case NedbankVoucherStatus.REDEEMED:
        newTransactionStatus = TransactionStatusEnum.success;
        break;

      case NedbankVoucherStatus.REFUNDED:
        newTransactionStatus = TransactionStatusEnum.error;
        break;

      case NedbankVoucherStatus.FAILED:
        newTransactionStatus = TransactionStatusEnum.error;
        break;

      default:
        // Do nothing if another voucher status is returned
        return;
    }
    await this.transactionScopedRepository.update(
      { id: transactionId },
      { status: newTransactionStatus, errorMessage: voucherInfo.errorMessage },
    );
  }
}
