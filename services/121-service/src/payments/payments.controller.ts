import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { CreatePaymentDto } from '@121-service/src/payments/dto/create-payment.dto';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { GetPaymentAggregationDto } from '@121-service/src/payments/dto/get-payment-aggregation.dto';
import { GetPaymentsDto } from '@121-service/src/payments/dto/get-payments.dto';
import { GetTransactionResponseDto } from '@121-service/src/payments/dto/get-transaction-response.dto';
import { PaymentReturnDto } from '@121-service/src/payments/dto/payment-return.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { RetryPaymentDto } from '@121-service/src/payments/dto/retry-payment.dto';
import { PaymentEventDataDto } from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentsCreationService } from '@121-service/src/payments/services/payments-creation.service';
import { PaymentsExcelFspService } from '@121-service/src/payments/services/payments-excel-fsp.service';
import { PaymentsExecutionService } from '@121-service/src/payments/services/payments-execution.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { GetTransactionsQueryDto } from '@121-service/src/payments/transactions/dto/get-transaction-query.dto';
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
    private readonly paymentsCreationService: PaymentsCreationService,
    private readonly paymentsExecutionService: PaymentsExecutionService,
    private readonly paymentsReportingService: PaymentsReportingService,
    private readonly paymentsExcelFspService: PaymentsExcelFspService,
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
      Instead it will return how many PA this action can be applied to.
      So no payments will be done.
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

    const result = await this.paymentsCreationService.createPayment({
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

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentSTART] })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Successfully executed the payment start or retry',
  })
  @ApiOperation({
    summary: 'Start or Retry payment to send payment instructions to FSP',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @ApiQuery({
    name: 'retry',
    required: false,
    type: 'boolean',
    description:
      'Default is false. If set to true, then (1) all failed transactions of payment are retried or (2) with a filter on referenceIds passed via body. Only failed transactions will be sent again with the original amount. If retry=false, then no body is needed',
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch('programs/:programId/payments/:paymentId')
  public async startOrRetryPayment(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Query('retry') retry = 'false',
    @Body() retryReferenceIds: RetryPaymentDto,
    @Req() req: ScopedUserRequest,
  ): Promise<void> {
    const userId = RequestHelper.getUserId(req);
    const retryBoolean = retry === 'true';

    if (retryBoolean) {
      await this.paymentsExecutionService.retryPayment({
        userId,
        programId,
        paymentId,
        referenceIds: retryReferenceIds.referenceIds,
      });
    } else {
      if (retryReferenceIds?.referenceIds?.length) {
        throw new HttpException(
          'When retry=false no body must be provided',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.paymentsExecutionService.startPayment({
        userId,
        programId,
        paymentId,
      });
    }
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentFspInstructionREAD],
  })
  @ApiOperation({
    summary:
      '[SCOPED] Get payments instructions for past payment to post in Fsp Portal',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Get payments instructions for past payment to post in Fsp Portal - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'This endpoint cannot be used when a payment is in progress',
  })
  @Get('programs/:programId/payments/:paymentId/fsp-instructions')
  public async getFspInstructions(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('paymentId', ParseIntPipe)
    paymentId: number,
  ): Promise<FspInstructions[]> {
    return await this.paymentsExcelFspService.getFspInstructions(
      programId,
      paymentId,
    );
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
  @ApiOperation({ summary: '[SCOPED] Get all transactions for this paymentId' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved transactions',
    type: [GetTransactionResponseDto],
  })
  @Get('programs/:programId/payments/:paymentId/transactions')
  public async getTransactions(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<GetTransactionResponseDto[]> {
    return await this.paymentsReportingService.getTransactionsByPaymentId({
      programId,
      paymentId,
    });
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
    type: [PaymentEventDataDto],
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
