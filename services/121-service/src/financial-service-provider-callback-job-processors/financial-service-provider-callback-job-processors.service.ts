import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-transfer-callback-job.dto';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class FinancialServiceProviderCallbackJobProcessorsService {
  public constructor(
    private readonly safaricomService: SafaricomService,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
  ) {}

  public async processSafaricomCallbackJob(
    jobData: SafaricomTransferCallbackJobDto,
    attempt = 1,
  ): Promise<void> {
    // 1. Get right safaricom transfer entity from database
    const safaricomTransfers =
      await this.safaricomService.getSafaricomTransferByOriginatorConversationId(
        jobData.Result.OriginatorConversationID,
      );

    // 2. If no safaricom transfer entity found yet, retry 3 times
    if (safaricomTransfers[0] === undefined && attempt <= 3) {
      attempt++;
      await waitFor(850);
      await this.processSafaricomCallbackJob(jobData, attempt);
      return;
    }

    // 3. Update safaricom transfer entity and transaction entity
    const safaricomTransfer = safaricomTransfers[0];
    safaricomTransfer.mpesaTransactionId = jobData.Result.TransactionID;

    const transaction = safaricomTransfer.transaction;

    if (jobData && jobData.Result && jobData.Result.ResultCode === 0) {
      transaction.status = StatusEnum.success;
    } else {
      transaction.status = StatusEnum.error;
      transaction.errorMessage = jobData.Result.ResultDesc;
    }

    await this.safaricomService.updateSafaricomTransfer(safaricomTransfer);
    await this.transactionScopedRepository.save(transaction);
  }
}
