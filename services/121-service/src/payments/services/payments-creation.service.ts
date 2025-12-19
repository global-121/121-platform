import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { BulkActionResultPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { ApproverService } from '@121-service/src/user/approver/approver.service';
import { ApproverResponseDto } from '@121-service/src/user/approver/dto/approver-response.dto';
import { PaymentApprovalEntity } from '@121-service/src/user/approver/entities/payment-approval.entity';

@Injectable()
export class PaymentsCreationService {
  @InjectRepository(PaymentEntity)
  private readonly paymentRepository: Repository<PaymentEntity>;

  public constructor(
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly paymentsHelperService: PaymentsHelperService,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly transactionsService: TransactionsService,
    private readonly approverService: ApproverService,
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
  ) {}

  public async createPayment({
    userId,
    programId,
    transferValue,
    query,
    dryRun,
    note,
  }: {
    userId: number;
    programId: number;
    transferValue: number | undefined;
    query: PaginateQuery;
    dryRun: boolean;
    note?: string;
  }): Promise<BulkActionResultPaymentDto> {
    if (dryRun) {
      await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
        programId,
      );
    } else {
      // Only lock payments when not a dry run
      await this.paymentsProgressHelperService.checkAndLockPaymentProgressOrThrow(
        { programId },
      );
    }

    // put all operations in try, to be able to always end with an unlock-payments action, also in case of failure
    try {
      // First run the logic that is needed in both dryRun and real payment scenario
      const { bulkActionResultPaymentDto, registrationsForPayment, approvers } =
        await this.getPaymentDryRunDetailsOrThrow({
          programId,
          transferValue,
          query,
        });
      if (registrationsForPayment.length < 1) {
        throw new HttpException(
          'No registrations found to create payment for',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (dryRun || !transferValue) {
        return bulkActionResultPaymentDto;
      }

      const paymentId = await this.createPaymentAndEventsEntities({
        userId,
        programId,
        note,
        approvers,
      });
      bulkActionResultPaymentDto.id = paymentId;

      const referenceIds = registrationsForPayment.map(
        (registration) => registration.referenceId,
      );
      const transactionCreationDetails =
        await this.getTransactionCreationDetails({
          referenceIds,
          transferValue,
          programId,
        });

      await this.transactionsService.createTransactionsAndEvents({
        transactionCreationDetails,
        paymentId,
        userId,
      });

      return bulkActionResultPaymentDto;
    } finally {
      if (!dryRun) {
        // make sure to unblock payments also in case of failure
        await this.paymentsProgressHelperService.unlockPaymentsForProgram(
          programId,
        );
      }
    }
  }

  private async getPaymentDryRunDetailsOrThrow({
    programId,
    transferValue,
    query,
  }: {
    programId: number;
    transferValue: number | undefined;
    query: PaginateQuery;
  }): Promise<{
    bulkActionResultPaymentDto: BulkActionResultPaymentDto;
    registrationsForPayment: MappedPaginatedRegistrationDto[];
    approvers: ApproverResponseDto[];
  }> {
    const approvers = await this.approverService.getApprovers({
      programId,
    });
    // ##TODO: Figma actually wants this check on 'create payment btn' click. This way, it happens one step later (moving from step1 to step2 of create-payment)
    if (approvers.length < 1) {
      throw new HttpException(
        'No approvers found for program, cannot create payment',
        HttpStatus.BAD_REQUEST,
      );
    }
    // TODO: REFACTOR: Move what happens in setQueryPropertiesBulkAction into this function, and call a refactored version of getBulkActionResult/getPaymentBaseQuery (create solution design first)
    const paginateQuery =
      this.registrationsBulkService.setQueryPropertiesBulkAction({
        query,
        includePaymentAttributes: true,
      });

    // Fill bulkActionResultDto with meta data of the payment being done
    const bulkActionResultDto =
      await this.registrationsBulkService.getBulkActionResult(
        paginateQuery,
        programId,
        this.getPaymentBaseQuery(), // We need to create a separate queryBuilder object twice or it will be modified twice
      );

    // If amount is not defined do not calculate the totalMultiplierSum
    // This happens when you call the endpoint with dryRun=true
    // Calling with dryrun is true happens in the pa table when you try to do a payment to decide which registrations are selectable
    if (!transferValue) {
      return {
        bulkActionResultPaymentDto: {
          ...bulkActionResultDto,
          sumPaymentAmountMultiplier: 0,
          programFspConfigurationNames: [],
        },
        registrationsForPayment: [],
        approvers,
      };
    }

    // Get array of RegistrationViewEntity objects to be paid
    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(programId, paginateQuery);

    // Calculate the totalMultiplierSum and create an array with all FSPs for this payment
    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    // This loop is pretty fast: with 131k registrations it takes ~38ms

    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
    }

    // Get unique programFspConfigurationNames in payment
    // Getting unique programFspConfigurationNames is relatively: with 131k registrations it takes ~36ms locally
    const programFspConfigurationNames = Array.from(
      new Set(
        registrationsForPayment.map(
          (registration) => registration.programFspConfigurationName,
        ),
      ),
    );

    await this.paymentsHelperService.checkFspConfigurationsOrThrow(
      programId,
      programFspConfigurationNames,
    );

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    const bulkActionResultPaymentDto: BulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      programFspConfigurationNames,
    };

    return {
      bulkActionResultPaymentDto,
      registrationsForPayment,
      approvers,
    };
  }

  private async createPaymentAndEventsEntities({
    userId,
    programId,
    note,
    approvers,
  }: {
    userId: number;
    programId: number;
    note?: string;
    approvers: ApproverResponseDto[];
  }): Promise<number> {
    const paymentApprovals = approvers.map((approver) => {
      const paymentApproval = new PaymentApprovalEntity();
      paymentApproval.approverId = approver.id;
      paymentApproval.approved = false;
      return paymentApproval;
    });

    const paymentEntity = new PaymentEntity();
    paymentEntity.programId = programId;
    paymentEntity.approvals = paymentApprovals;
    const savedPaymentEntity = await this.paymentRepository.save(paymentEntity);

    await this.paymentEventsService.createEvent({
      paymentId: savedPaymentEntity.id,
      userId,
      type: PaymentEvent.created,
    });

    if (note) {
      await this.paymentEventsService.createNoteEvent({
        paymentId: savedPaymentEntity.id,
        userId,
        note,
      });
    }

    return savedPaymentEntity.id;
  }

  private async getRegistrationsForPaymentChunked(
    programId: number,
    paginateQuery: PaginateQuery,
  ) {
    return await this.registrationsPaginationService.getRegistrationViewsNoLimit(
      { programId, paginateQuery, queryBuilder: this.getPaymentBaseQuery() },
    );
  }

  private getPaymentBaseQuery(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.registrationsBulkService
      .getBaseQuery()
      .andWhere('registration.status = :status', {
        status: RegistrationStatusEnum.included,
      });
  }

  private async getTransactionCreationDetails({
    referenceIds,
    transferValue,
    programId,
  }: {
    referenceIds: string[];
    transferValue: number;
    programId: number;
  }): Promise<TransactionCreationDetails[]> {
    const idColumn: keyof RegistrationViewEntity = 'id';
    const programFspConfigurationIdColumn: keyof RegistrationViewEntity =
      'programFspConfigurationId';
    const registrations =
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        {
          programId,
          referenceIds,
          select: [
            idColumn,
            GenericRegistrationAttributes.paymentAmountMultiplier,
            programFspConfigurationIdColumn,
          ],
        },
      );

    return registrations.map((row) => ({
      registrationId: row.id,
      transferValue: transferValue * row.paymentAmountMultiplier,
      programFspConfigurationId: row.programFspConfigurationId,
    }));
  }

  public async approvePayment({
    userId,
    programId,
    paymentId,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
  }): Promise<void> {
    const approver = await this.approverService.getApproverByUserIdOrThrow({
      userId,
      programId,
    });

    const paymentEntity = await this.paymentRepository.findOneOrFail({
      where: { id: Equal(paymentId) },
      relations: { approvals: true },
    });
    const paymentApproval = paymentEntity.approvals.find(
      (approval) => approval.approverId === approver.id,
    );
    if (!paymentApproval) {
      // This should never happen
      throw new HttpException(
        'Approver not assigned to this payment',
        HttpStatus.BAD_REQUEST,
      );
    }
    paymentApproval.approved = true;
    await this.paymentRepository.save(paymentEntity);

    // store payment event
    // ##TODO: make the description become more specific (see Figma)
    await this.paymentEventsService.createEvent({
      paymentId,
      userId,
      type: PaymentEvent.approved,
    });

    // check if all approvals are done now
    const allApproved = paymentEntity.approvals.every(
      (approval) => approval.approved,
    );
    if (allApproved) {
      await this.processFinalApproval({
        userId,
        paymentId,
        programId,
      });
    }
  }

  private async processFinalApproval({
    userId,
    paymentId,
    programId,
  }: {
    userId: number;
    paymentId: number;
    programId: number;
  }): Promise<void> {
    // get transactions to approve
    const transactionsToApprove =
      await this.transactionViewScopedRepository.getByStatusOfIncludedRegistrations(
        {
          programId,
          paymentId,
          status: TransactionStatusEnum.pendingApproval,
        },
      );
    if (transactionsToApprove.length === 0) {
      throw new HttpException(
        {
          errors: 'No "pending approval" transactions found for this payment.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // loop over FSPs and approve transactions in bulk per FSP
    const fspConfigIds = new Set(
      transactionsToApprove
        .map((t) => t.programFspConfigurationId)
        .filter((id) => id !== null),
    );
    for (const programFspConfigurationId of fspConfigIds) {
      const fspConfigTransactions = transactionsToApprove.filter(
        (t) => t.programFspConfigurationId === programFspConfigurationId,
      );
      if (fspConfigTransactions.length === 0) {
        continue;
      }
      await this.transactionsService.saveProgressBulk({
        newTransactionStatus: TransactionStatusEnum.approved,
        transactionIds: fspConfigTransactions.map((t) => t.id),
        description: TransactionEventDescription.approval,
        userId,
        programFspConfigurationId,
      });
    }
  }
}
