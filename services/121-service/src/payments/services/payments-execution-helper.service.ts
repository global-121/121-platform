import { Injectable } from '@nestjs/common';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';

@Injectable()
export class PaymentsExecutionHelperService {
  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly programRepository: ProgramRepository,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationsBulkService: RegistrationsBulkService,
  ) {}

  /**
   * Creates transactions & events and updates registration payment counts.
   * Returns created transaction ids.
   */
  public async createTransactionsAndUpdateRegistrationPaymentCount({
    transactionCreationDetails,
    paymentId,
    userId,
  }: {
    transactionCreationDetails: TransactionCreationDetails[];
    paymentId: number;
    userId: number;
  }): Promise<number[]> {
    if (transactionCreationDetails.length === 0) {
      return [];
    }

    const transactionIds =
      await this.transactionsService.createTransactionsAndEvents({
        transactionCreationDetails,
        paymentId,
        userId,
      });

    await this.registrationScopedRepository.increasePaymentCountByOne(
      transactionCreationDetails.map((t) => t.registrationId),
      2000,
    );

    return transactionIds;
  }

  /**
   * Checks program settings and completes registrations when applicable.
   * This mirrors the previous orchestration logic but has no external side-effects
   * beyond calling the registrationsBulkService to apply status changes and send messages.
   */
  public async setStatusToCompletedIfApplicable(
    programId: number,
    userId: number,
  ): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);
    if (!program.enableMaxPayments) {
      return;
    }

    const registrationsToComplete =
      await this.registrationScopedRepository.getRegistrationsToComplete(
        programId,
      );
    if (registrationsToComplete.length === 0) {
      return;
    }

    const isTemplateAvailable =
      await this.messageTemplateService.isTemplateAvailable(
        programId,
        RegistrationStatusEnum.completed,
      );
    const messageContentDetails: MessageContentDetails = isTemplateAvailable
      ? {
          messageTemplateKey: RegistrationStatusEnum.completed,
          messageContentType: MessageContentType.completed,
          message: '',
        }
      : {};

    await this.registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds(
      {
        referenceIds: registrationsToComplete.map((r) => r.referenceId),
        programId,
        registrationStatus: RegistrationStatusEnum.completed,
        userId,
        messageContentDetails,
      },
    );
  }
}
