import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Paginate, PaginatedSwaggerDocs, PaginateQuery } from 'nestjs-paginate';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';
import {
  PaginateConfigTransactionView,
  PaginateConfigTransactionViewRetry,
} from '@121-service/src/payments/consts/paginate-config-transaction-view.const';
import { CreatePaymentDto } from '@121-service/src/payments/dto/create-payment.dto';
import { ExportTransactionResponseDto } from '@121-service/src/payments/dto/export-transaction-response.dto';
import { GetPaymentAggregationDto } from '@121-service/src/payments/dto/get-payment-aggregation.dto';
import { GetPaymentsDto } from '@121-service/src/payments/dto/get-payments.dto';
import { PaymentReturnDto } from '@121-service/src/payments/dto/payment-return.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentsExecutionService } from '@121-service/src/payments/services/payments-execution.service';
import { PaymentsManagementService } from '@121-service/src/payments/services/payments-management.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { FindAllTransactionsResultDto } from '@121-service/src/payments/transactions/dto/find-all-transactions-result.dto';
import { GetTransactionsQueryDto } from '@121-service/src/payments/transactions/dto/get-transaction-query.dto';
import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';
import { PaginateConfigRegistrationViewOnlyFilters } from '@121-service/src/registration/const/filter-operation.const';
import {
  BulkActionResultDto,
  BulkActionResultPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';
import { sendXlsxReponse } from '@121-service/src/utils/send-xlsx-response';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('payments')
@Controller()
export class PaymentsController {
  public constructor(
    private readonly paymentsManagementService: PaymentsManagementService,
    private readonly paymentsExecutionService: PaymentsExecutionService,
    private readonly paymentsReportingService: PaymentsReportingService,
    private readonly registrationsPaginateService: RegistrationsPaginationService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({ summary: 'Get past payments for program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get past payments for program',
  })
  @Get('programs/:programId/payments')
  public async getPayments(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<GetPaymentsDto[]> {
    return await this.paymentsReportingService.getPayments({ programId });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({ summary: 'Get current status of all payments for program. ' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status of all payments for program',
  })
  @Get('programs/:programId/payments/status')
  public async getPaymentStatus(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<ProgramPaymentsStatusDto> {
    return await this.paymentsReportingService.getProgramPaymentsStatus(
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({ summary: '[SCOPED] Get payment aggregate results' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'paymentId',
    required: true,
    type: 'integer',
    description: 'Request transactions from a specific payment id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retrieved payment aggregate results - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: PaymentReturnDto,
  })
  @Get('programs/:programId/payments/:paymentId')
  public async getPaymentAggregation(
    @Param() params: GetPaymentAggregationDto,
  ): Promise<PaymentReturnDto> {
    return await this.paymentsReportingService.getPaymentAggregation(
      Number(params.programId),
      Number(params.paymentId),
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentCREATE] })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run result for creating a payment - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Creating payment and transactions successfully - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary: '[SCOPED] Created payment and transactions',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @PaginatedSwaggerDocs(
    RegistrationViewEntity,
    PaginateConfigRegistrationViewOnlyFilters,
  )
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description: `
      Only when set explicitly to "true", this will simulate (and NOT actually DO) the action.
      Instead it will return how many PAs this action can be applied to.
      So no transactions will be created yet.
      `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('programs/:programId/payments')
  public async createPayment(
    @Body() data: CreatePaymentDto,
    @Paginate() query: PaginateQuery,
    @Param('programId', ParseIntPipe) programId: number,
    @Req() req: ScopedUserRequest,
    @Query('dryRun') dryRun = 'false', // Query decorator can be used in combination with Paginate decorator
  ): Promise<BulkActionResultPaymentDto> {
    const userId = RequestHelper.getUserId(req);

    await this.registrationsPaginateService.throwIfNoPersonalReadPermission(
      userId,
      programId,
      query,
    );
    const dryRunBoolean = dryRun === 'true'; // defaults to false
    if (
      !dryRunBoolean &&
      (data.transferValue === undefined || data.transferValue <= 0)
    ) {
      throw new HttpException(
        'Amount should be larger than 0 when not using dry run',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.paymentsManagementService.createPayment({
      userId,
      programId,
      transferValue: data.transferValue,
      query,
      dryRun: dryRunBoolean,
      note: data.note,
    });

    if (dryRunBoolean) {
      // If dryRun is true the status code is 200 because nothing changed (201) and nothing is going to change (202)
      // I did not find another way to send a different status code than with a HttpException
      throw new HttpException(result, HttpStatus.OK);
    }
    return result;
  }

  @AuthenticatedUser() // No permission-check, as this is handled by checking if the request userId is an approver for this payment's program
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully approved the payment',
  })
  @ApiOperation({
    summary: 'Approve payment',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @HttpCode(HttpStatus.CREATED)
  @Post('programs/:programId/payments/:paymentId/approve')
  public async approvePayment(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<void> {
    const userId = RequestHelper.getUserId(req);

    return await this.paymentsManagementService.approvePayment({
      userId,
      programId,
      paymentId,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentUPDATE] })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Successfully started the payment',
  })
  @ApiOperation({
    summary: 'Start payment to send payment instructions to FSP',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('programs/:programId/payments/:paymentId/start')
  public async startPayment(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<void> {
    const userId = RequestHelper.getUserId(req);

    return await this.paymentsExecutionService.startPayment({
      userId,
      programId,
      paymentId,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentUPDATE] })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Successfully retried the payment',
  })
  @ApiOperation({
    summary:
      'Retry payment to send payment instructions to FSP for failed transactions',
  })
  @PaginatedSwaggerDocs(
    TransactionViewEntity,
    PaginateConfigTransactionViewRetry,
  )
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'boolean',
    description: 'Not used for this endpoint',
    deprecated: true,
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description: `
      Only when set explicitly to "true", this will simulate (and NOT actually DO) the action.
      Instead it will return how many PAs this action can be applied to.
      So no transactions will be retried yet.
      `,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('programs/:programId/payments/:paymentId/retry')
  public async retryPayment(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Paginate() paginateQuery: PaginateQuery,
    @Req() req: ScopedUserRequest,
    @Query('dryRun') dryRun = 'false',
  ): Promise<BulkActionResultDto> {
    const userId = RequestHelper.getUserId(req);

    return await this.paymentsExecutionService.retryPayment({
      userId,
      programId,
      paymentId,
      paginateQuery,
      dryRun: dryRun === 'true',
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Gets all transactions for a date range in json (default) or xlsx format',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'fromDate', required: false, type: 'string' })
  @ApiQuery({ name: 'toDate', required: false, type: 'string' })
  @ApiQuery({
    name: 'paymentId',
    required: false,
    type: 'integer',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ExportFileFormat,
    description:
      'Format to return the data in. Options are "json" and "xlsx". Defaults to "json" if not specified.',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  // This transaction export controller is located in the payments controller because the transaction modules have no knowledge of programs and registrations
  // We tried to name this controller first 'programs/:programId/payments/transactions but than it conflicted with the getTransactions route
  @Get('programs/:programId/transactions')
  public async exportTransactionsUsingDateFilter(
    @Res() res: Response,
    @Param('programId', ParseIntPipe) programId: number,
    @Query() query: GetTransactionsQueryDto,
  ): Promise<Response | void> {
    const result =
      await this.paymentsReportingService.exportTransactionsUsingDateFilter({
        programId,
        fromDateString: query.fromDate,
        toDateString: query.toDate,
        paymentId: query.paymentId ? Number(query.paymentId) : undefined,
      });
    switch (query.format) {
      case ExportFileFormat.xlsx:
        return sendXlsxReponse(result.data, result.fileName, res);
      case ExportFileFormat.json:
      case undefined:
        return res.send(result);
    }
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({
    summary: '[SCOPED] Get paginated transactions for this paymentId',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved transactions',
    type: [ExportTransactionResponseDto],
  })
  @PaginatedSwaggerDocs(TransactionViewEntity, PaginateConfigTransactionView)
  @Get('programs/:programId/payments/:paymentId/transactions')
  public async getTransactionsByPaymentIdPaginated(
    @Paginate() paginateQuery: PaginateQuery,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<FindAllTransactionsResultDto> {
    return await this.paymentsReportingService.getTransactionsByPaymentIdPaginated(
      {
        programId,
        paymentId,
        paginateQuery,
      },
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({
    summary: 'Get all Payment Events for a Payment.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return Payment Events by Payment Id.',
    type: [Object],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program or Payment does not exist',
  })
  @Get('programs/:programId/payments/:paymentId/events')
  public async getPaymentEvents(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('paymentId', ParseIntPipe)
    paymentId: number,
  ): Promise<PaymentEventsReturnDto> {
    return this.paymentsReportingService.getPaymentEvents({
      programId,
      paymentId,
    });
  }
}
