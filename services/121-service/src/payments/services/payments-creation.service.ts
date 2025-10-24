import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { BulkActionResultPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';

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
      const { bulkActionResultPaymentDto, registrationsForPayment } =
        await this.getPaymentDryRunDetailsOrThrow({
          programId,
          transferValue,
          query,
        });
      if (!transferValue) {
        return bulkActionResultPaymentDto;
      }
      if (registrationsForPayment.length < 1) {
        throw new HttpException(
          'No registrations found to create payment for',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (dryRun) {
        return bulkActionResultPaymentDto;
      }

      const paymentId = await this.createPaymentAndEventsEntities({
        userId,
        programId,
        note,
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
  }> {
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
    };
  }

  private async createPaymentAndEventsEntities({
    userId,
    programId,
    note,
  }: {
    userId: number;
    programId: number;
    note?: string;
  }): Promise<number> {
    const paymentEntity = new PaymentEntity();
    paymentEntity.programId = programId;
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
}
