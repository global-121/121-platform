import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { BulkActionResultPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
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
    private readonly actionService: ActionsService,
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
    if (!dryRun) {
      await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
        programId,
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
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        programFspConfigurationNames: [],
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

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    const bulkActionResultPaymentDto: BulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      programFspConfigurationNames,
    };

    // Create an array of referenceIds to be paid
    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun) {
      if (referenceIds.length < 1) {
        throw new HttpException(
          'No registrations found to create payment for',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.paymentsHelperService.checkFspConfigurationsOrThrow(
        programId,
        programFspConfigurationNames,
      );
      const paymentId = await this.createPaymentAndEventsEntities({
        userId,
        programId,
        note,
      });
      bulkActionResultPaymentDto.id = paymentId;

      // ##TODO: Refactor actions/payment-in-progress
      await this.actionService.saveAction(
        userId,
        programId,
        AdditionalActionType.paymentStarted,
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

      void this.actionService.saveAction(
        userId,
        programId,
        AdditionalActionType.paymentFinished,
      );
    }
    return bulkActionResultPaymentDto;
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

    await this.paymentEventsService.createEventWithoutAttributes({
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
    const chunkSize = 4000;

    return await this.registrationsPaginationService.getRegistrationViewsChunkedByPaginateQuery(
      programId,
      paginateQuery,
      chunkSize,
      this.getPaymentBaseQuery(),
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
      await this.registrationsPaginationService.getRegistrationViewsChunkedByReferenceIds(
        {
          programId,
          referenceIds,
          select: [
            idColumn,
            GenericRegistrationAttributes.paymentAmountMultiplier,
            programFspConfigurationIdColumn,
          ],
          chunkSize: 4000,
        },
      );

    return registrations.map((row) => ({
      registrationId: row.id,
      transferValue: transferValue * row.paymentAmountMultiplier,
      programFspConfigurationId: row.programFspConfigurationId,
    }));
  }
}
