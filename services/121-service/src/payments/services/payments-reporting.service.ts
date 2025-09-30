import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, Repository } from 'typeorm';

import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { GetTransactionResponseDto } from '@121-service/src/payments/dto/get-transaction-response.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { PaymentsReportingHelperService } from '@121-service/src/payments/services/payments-reporting.helper.service';
import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class PaymentsReportingService {
  @InjectRepository(PaymentEntity)
  private readonly paymentRepository: Repository<PaymentEntity>;

  public constructor(
    private readonly paymentsReportingHelperService: PaymentsReportingHelperService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
    private readonly registrationPaginationService: RegistrationsPaginationService,
    private readonly dataSource: DataSource,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly transactionEventsService: TransactionEventsService,
  ) {}

  public async getPayments({
    programId,
    limitNumberOfPayments,
  }: {
    programId: number;
    limitNumberOfPayments?: number;
  }) {
    const rawPayments = await this.paymentRepository.find({
      where: {
        programId: Equal(programId),
      },
      select: ['id', 'created'],
      order: {
        id: 'DESC',
      },
      take: limitNumberOfPayments,
    });

    const payments = rawPayments.map((payment) => ({
      paymentId: payment.id,
      paymentDate: payment.created,
    }));
    return payments;
  }

  public async getPaymentAggregation(
    programId: number,
    paymentId: number,
  ): Promise<PaymentReturnDto> {
    // Scoped, as this.transactionScopedRepository is used in the transaction.service.ts
    const statusAggregation = await this.aggregateTransactionsByStatus(
      programId,
      paymentId,
    );

    const totalAmountPerStatus: Record<
      string,
      { count: number; amount: number }
    > = {};

    for (const row of statusAggregation) {
      const status = row.status;

      if (!totalAmountPerStatus[status]) {
        totalAmountPerStatus[status] = {
          count: 0,
          amount: 0,
        };
      }

      totalAmountPerStatus[status].count = Number(row.count);
      totalAmountPerStatus[status].amount = Number(row.totalamount);
    }
    return {
      [TransactionStatusEnum.success]: totalAmountPerStatus[
        TransactionStatusEnum.success
      ] || {
        count: 0,
        amount: 0,
      },
      [TransactionStatusEnum.waiting]: totalAmountPerStatus[
        TransactionStatusEnum.waiting
      ] || {
        count: 0,
        amount: 0,
      },
      // TODO: as soon as this has changed update metric.model.ts in the frontend
      failed: totalAmountPerStatus[TransactionStatusEnum.error] || {
        count: 0,
        amount: 0,
      },
    };
  }

  // TODO: Move to scoped transaction repository however it will be changed when implementing segregation of duties, so let's leave the refactor until than
  private async aggregateTransactionsByStatus(
    programId: number,
    paymentId: number,
  ): Promise<any[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select([
        'status',
        'COUNT(*) as count',
        // rounding individual transaction amounts to 2 decimal places before summing, in line with current FSPs:
        'SUM(ROUND(amount::numeric, 2)) as totalamount',
      ])
      .from(
        '(' +
          this.transactionScopedRepository
            .getLastTransactionsQuery({ programId, paymentId })
            .getQuery() +
          ')',
        'transactions',
      )
      .setParameters(
        this.transactionScopedRepository
          .getLastTransactionsQuery({ programId, paymentId })
          .getParameters(),
      )
      .groupBy('status')
      .getRawMany();
  }

  public async getProgramPaymentsStatus(
    programId: number,
  ): Promise<ProgramPaymentsStatusDto> {
    return {
      inProgress:
        await this.paymentsProgressHelperService.isPaymentInProgress(programId),
    };
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
    (GetTransactionResponseDto & // This is the type returned by the transaction repository
      Record<string, unknown>)[] // These are the dynamic fsp specific fields & the dynamic configured fields from the registration as set in 'export' of program registration attributes
  > {
    const fspSpecificJoinFields =
      await this.paymentsReportingHelperService.getFspSpecificJoinFields(
        programId,
      );

    const transactions = await this.transactionScopedRepository.getTransactions(
      {
        programId,
        paymentId,
        fromDate,
        toDate,
        fspSpecificJoinFields,
      },
    );

    if (!transactions || transactions.length === 0) {
      return [];
    }

    const referenceIds = transactions.map((t) => t.registrationReferenceId);

    select.push(GenericRegistrationAttributes.referenceId);
    const registrationViews =
      (await this.registrationPaginationService.getRegistrationViewsChunkedByReferenceIds(
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

  private async findPaymentOrThrow(
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

  public async getTransactionsByPaymentId({
    programId,
    paymentId,
  }: {
    programId: number;
    paymentId: number;
  }): Promise<GetTransactionResponseDto[]> {
    await this.findPaymentOrThrow(programId, paymentId);
    // For in the portal we always want the name of the registration, so we need to select it
    const select = [DefaultRegistrationDataAttributeNames.name];

    const transactions = await this.getTransactions({
      programId,
      paymentId,
      select,
    });

    return transactions;
  }
}
