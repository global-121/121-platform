import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Equal, Repository } from 'typeorm';

import { DEFAULT_PAGINATION_LIMIT } from '@121-service/src/config';
import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { PaginateConfigTransactionView } from '@121-service/src/payments/consts/paginate-config-transaction-view.const';
import { ApprovalStatusResponseDto } from '@121-service/src/payments/dto/approval-status-response.dto';
import { ExportTransactionResponseDto } from '@121-service/src/payments/dto/export-transaction-response.dto';
import { PaginatedTransactionDto } from '@121-service/src/payments/dto/paginated-transaction.dto';
import { PaymentAggregationFullDto } from '@121-service/src/payments/dto/payment-aggregation-full.dto';
import { PaymentAggregationSummaryDto } from '@121-service/src/payments/dto/payment-aggregation-summary.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { PaymentApprovalEntity } from '@121-service/src/payments/entities/payment-approval.entity';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentRepository } from '@121-service/src/payments/repositories/payment.repository';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { FindAllTransactionsResultDto } from '@121-service/src/payments/transactions/dto/find-all-transactions-result.dto';
import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { PaginateQueryLimitRequired } from '@121-service/src/shared/types/paginate-query-limit-required.type';
@Injectable()
export class PaymentsReportingService {
  @InjectRepository(PaymentApprovalEntity)
  private readonly paymentApprovalRepository: Repository<PaymentApprovalEntity>;

  public constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentsReportingHelperService: PaymentsReportingHelperService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
    private readonly registrationPaginationService: RegistrationsPaginationService,
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly programRepository: ProgramRepository,
  ) {}

  public async getPaymentAggregationsSummaries({
    programId,
    limitNumberOfPayments,
    paymentId,
  }: {
    programId: number;
    limitNumberOfPayments?: number;
    paymentId?: number;
  }): Promise<PaymentAggregationSummaryDto[]> {
    const paymentsAndApprovalStatusses =
      await this.paymentRepository.getPaymentsAndApprovalState({
        programId,
        paymentId,
      });

    const aggregationResults =
      await this.transactionViewScopedRepository.aggregateTransactionsByStatusForAllPayments(
        {
          programId,
          paymentId,
        },
      );

    let payments =
      this.paymentsReportingHelperService.buildPaymentAggregationSummaries({
        paymentsAndApprovalStatusses,
        aggregationResults,
      });

    if (limitNumberOfPayments) {
      payments = payments.slice(0, limitNumberOfPayments);
    }

    return payments;
  }

  public async getPaymentAggregationFull({
    programId,
    paymentId,
  }: {
    programId: number;
    paymentId: number;
  }): Promise<PaymentAggregationFullDto> {
    await this.findPaymentOrThrow(programId, paymentId);
    const getPaymentAggregationSummary =
      await this.getPaymentAggregationsSummaries({
        programId,
        paymentId,
      });
    const fsps = await this.transactionViewScopedRepository.getAllFspsInPayment(
      {
        programId,
        paymentId,
      },
    );

    const approvalStatus = await this.getPaymentApprovalStatus({
      paymentId,
    });

    return { ...getPaymentAggregationSummary[0], fsps, approvalStatus };
  }

  public async getProgramPaymentsStatus(
    programId: number,
  ): Promise<ProgramPaymentsStatusDto> {
    return {
      inProgress:
        await this.paymentsProgressHelperService.isPaymentInProgress(programId),
    };
  }

  public async getPaymentApprovalStatus({
    paymentId,
  }: {
    paymentId: number;
  }): Promise<ApprovalStatusResponseDto[]> {
    const paymentApprovals = await this.paymentApprovalRepository.find({
      where: {
        paymentId: Equal(paymentId),
      },
      relations: {
        programApprovalThreshold: {
          approvers: { programAidworkerAssignment: { user: true } },
        },
      },
      order: { rank: 'ASC' },
    });
    return paymentApprovals.map((approval) => {
      const { programApprovalThreshold } = approval;
      return {
        id: approval.id,
        approved: approval.approved,
        username:
          programApprovalThreshold?.approvers
            ?.map((a) => a.programAidworkerAssignment?.user?.username)
            .filter(Boolean)
            .join(', ') || null,
        rank: approval.rank,
      };
    });
  }

  public async exportTransactionsUsingDateFilter({
    programId,
    fromDateString,
    toDateString,
    paymentId,
  }: {
    programId: number;
    fromDateString?: string;
    toDateString?: string;
    paymentId?: number;
  }): Promise<FileDto> {
    // Convert string dates to Date objects
    const fromDate = fromDateString ? new Date(fromDateString) : undefined;
    const toDate = toDateString ? new Date(toDateString) : undefined;

    const fileName =
      this.paymentsReportingHelperService.createTransactionsExportFilename(
        programId,
        fromDate,
        toDate,
      );

    const select =
      await this.paymentsReportingHelperService.getSelectForExport(programId);
    const transactions = await this.getTransactions({
      programId,
      select,
      fromDate,
      toDate,
      paymentId,
    });

    const dropdownAttributes =
      await this.programRegistrationAttributeRepository.getDropdownAttributes({
        programId,
        select,
      });

    return {
      data: RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel({
        rows: transactions,
        attributes: dropdownAttributes,
      }),
      fileName,
    };
  }

  private async getTransactions({
    programId,
    select,
    paymentId,
    fromDate,
    toDate,
  }: {
    programId: number;
    select: string[];
    paymentId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<
    (ExportTransactionResponseDto & // This is the type returned by the transaction repository
      Record<string, unknown>)[] // These are the dynamic fsp specific fields & the dynamic configured fields from the registration as set in 'export' of program registration attributes
  > {
    const fspSpecificJoinFields =
      await this.paymentsReportingHelperService.getFspSpecificJoinFields(
        programId,
      );
    const enableScope = (
      await this.programRepository.findOneOrFail({
        where: { id: Equal(programId) },
      })
    ).enableScope;

    const transactions =
      await this.transactionViewScopedRepository.getTransactions({
        programId,
        paymentId,
        fromDate,
        toDate,
        fspSpecificJoinFields,
        enableScope,
      });

    if (!transactions || transactions.length === 0) {
      return [];
    }

    const referenceIds = transactions.map((t) => t.registrationReferenceId);

    select.push(GenericRegistrationAttributes.referenceId);
    const registrationViews =
      (await this.registrationPaginationService.getRegistrationViewsByReferenceIds(
        { programId, referenceIds, select },
      )) as Omit<MappedPaginatedRegistrationDto, 'status'>[];

    // Create a map for faster lookups
    const registrationViewMap = new Map(
      registrationViews.map((item) => [item.referenceId, item]),
    );

    const transactionsEnriched = transactions.map((transaction) => {
      const registrationView = registrationViewMap.get(
        transaction.registrationReferenceId,
      );

      if (!registrationView) {
        return { ...transaction };
      }
      // De-structure 'name' as 'registrationName', and spread the rest
      const { name, referenceId: _referenceId, ...rest } = registrationView;
      return {
        ...transaction,
        registrationName: name,
        ...rest,
      };
    });

    return transactionsEnriched;
  }

  public async getPaymentEvents({
    programId,
    paymentId,
  }: {
    programId: number;
    paymentId: number;
  }): Promise<PaymentEventsReturnDto> {
    await this.findPaymentOrThrow(programId, paymentId);
    return this.paymentEventsService.getPaymentEvents(paymentId);
  }

  public async findPaymentOrThrow(
    programId: number,
    paymentId: number,
  ): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id: Equal(paymentId), programId: Equal(programId) },
    });

    if (!payment) {
      throw new HttpException(
        `Payment with ID ${paymentId} not found in program ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  public async getTransactionsByPaymentIdPaginatedAndSetDefaultLimit({
    programId,
    paymentId,
    paginateQuery,
  }: {
    programId: number;
    paymentId: number;
    paginateQuery: PaginateQuery;
  }): Promise<FindAllTransactionsResultDto> {
    const queryWithDefaultLimit = {
      ...paginateQuery,
      limit: paginateQuery.limit ?? DEFAULT_PAGINATION_LIMIT,
    };

    return this.getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      paginateQuery: queryWithDefaultLimit,
    });
  }

  public async getTransactionsByPaymentIdPaginated({
    programId,
    paymentId,
    paginateQuery,
  }: {
    programId: number;
    paymentId: number;
    paginateQuery: PaginateQueryLimitRequired;
  }): Promise<FindAllTransactionsResultDto> {
    await this.findPaymentOrThrow(programId, paymentId);

    const queryBuilder =
      this.transactionViewScopedRepository.createQueryBuilderFilterByProgramAndPaymentId(
        {
          programId,
          paymentId,
        },
      );

    const result = await paginate<TransactionViewEntity>(
      paginateQuery,
      queryBuilder,
      {
        ...PaginateConfigTransactionView,
      },
    );

    return result as Paginated<PaginatedTransactionDto>; // This type-conversion is done to make our frontend happy as it cannot deal with typeorm entities
  }

  public async getReferenceIdsForPaginateQuery({
    programId,
    paymentId,
    paginateQuery,
  }: {
    programId: number;
    paymentId: number;
    paginateQuery: PaginateQuery;
  }): Promise<string[]> {
    await this.findPaymentOrThrow(programId, paymentId);
    const paginateQueryNoLimit = { ...paginateQuery, limit: -1 };
    const result = await this.getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      paginateQuery: paginateQueryNoLimit,
    });

    const referenceIds = result.data.map((t) => t.registrationReferenceId);
    return referenceIds.filter(
      (referenceId) => referenceId !== null && referenceId !== undefined,
    );
  }
}
