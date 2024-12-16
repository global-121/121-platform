import { Injectable } from '@nestjs/common';
import { In, IsNull, Not } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';

@Injectable()
export class FinancialSyncService {
  public constructor(
    private readonly nedbankService: NedbankService,
    private readonly nedbankVoucherScopedRepository: NedbankVoucherScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
  ) {}

  public async syncNedbankVoucherAndTransactionStatusses(): Promise<void> {
    const vouchers = await this.nedbankVoucherScopedRepository.find({
      select: ['id', 'orderCreateReference', 'transactionId'],
      where: [
        { status: IsNull() },
        {
          status: Not(
            In([NedbankVoucherStatus.REDEEMED, NedbankVoucherStatus.REFUNDED]),
          ),
        },
      ],
    });

    for (const voucher of vouchers) {
      let voucherStatus: NedbankVoucherStatus;
      try {
        voucherStatus =
          await this.nedbankService.retrieveAndUpdateVoucherStatus(
            voucher.orderCreateReference,
            voucher.id,
          );
      } catch (error) {
        // ##TODO what extend should end the loop if something goes wrong?
        if (error instanceof NedbankError) {
          console.error(
            `Error while getting order for voucher ${voucher.id}: ${error.message}`,
          );
          continue;
        } else {
          throw error;
        }
      }

      // ##TODO: Should the NedbankService know about the TransactionModule?
      // It is the case in https://miro.com/app/board/uXjVLVYmSPM=/?moveToWidget=3458764603767347191&cot=14 however I am not sure about it
      if (voucherStatus === NedbankVoucherStatus.REDEEMED) {
        await this.transactionScopedRepository.update(
          { id: voucher.transactionId },
          { status: TransactionStatusEnum.success },
        );
      }
      if (voucherStatus === NedbankVoucherStatus.REFUNDED) {
        await this.transactionScopedRepository.update(
          { id: voucher.transactionId },
          {
            status: TransactionStatusEnum.error,
            errorMessage:
              'Voucher has been refunded by Nedbank. Please contact Nedbank support.', // TODO: is this the correct ux copy?
          },
        );
      }
    }
  }
}
