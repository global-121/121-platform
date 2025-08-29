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
import { GetPaymentAggregationDto } from '@121-service/src/payments/dto/get-payment-aggregration.dto';
import { GetPaymentsDto } from '@121-service/src/payments/dto/get-payments.dto';
import { GetTransactionResponseDto } from '@121-service/src/payments/dto/get-transaction-response.dto';
import { ProjectPaymentsStatusDto } from '@121-service/src/payments/dto/project-payments-status.dto';
import { RetryPaymentDto } from '@121-service/src/payments/dto/retry-payment.dto';
import { PaymentEventDataDto } from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentsExcelFspService } from '@121-service/src/payments/services/payments-excel-fsp.service';
import { PaymentsExecutionService } from '@121-service/src/payments/services/payments-execution.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { PaginateConfigRegistrationViewOnlyFilters } from '@121-service/src/registration/const/filter-operation.const';
import {
  BulkActionResultDto,
  BulkActionResultPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
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
    private readonly paymentsExecutionService: PaymentsExecutionService,
    private readonly paymentsReportingService: PaymentsReportingService,
    private readonly paymentsExcelFspService: PaymentsExcelFspService,
    private readonly registrationsPaginateService: RegistrationsPaginationService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({ summary: 'Get past payments for project' })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get past payments for project',
  })
  @Get('projects/:projectId/payments')
  public async getPayments(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<GetPaymentsDto[]> {
    return await this.paymentsReportingService.getPayments(projectId);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({ summary: 'Get current status of all payments for project. ' })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status of all payments for project',
  })
  @Get('projects/:projectId/payments/status')
  public async getPaymentStatus(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<ProjectPaymentsStatusDto> {
    return await this.paymentsReportingService.getProjectPaymentsStatus(
      projectId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({ summary: '[SCOPED] Get payment aggregate results' })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({
    name: 'paymentId',
    required: true,
    type: 'integer',
    description: 'Request transactions from a specific payment id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retrieved payment aggregate results - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
    type: PaymentReturnDto,
  })
  @Get('projects/:projectId/payments/:paymentId')
  public async getPaymentAggregation(
    @Param() params: GetPaymentAggregationDto,
  ): Promise<PaymentReturnDto> {
    return await this.paymentsReportingService.getPaymentAggregation(
      Number(params.projectId),
      Number(params.paymentId),
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentCREATE] })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run result for doing a payment - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Doing the payment was succesfully started - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary: '[SCOPED] Send payout instruction to fsps',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
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
  @Post('projects/:projectId/payments')
  public async createPayment(
    @Body() data: CreatePaymentDto,
    @Paginate() query: PaginateQuery,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: ScopedUserRequest,
    @Query('dryRun') dryRun = 'false', // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultPaymentDto> {
    const userId = RequestHelper.getUserId(req);

    await this.registrationsPaginateService.throwIfNoPersonalReadPermission(
      userId,
      projectId,
      query,
    );
    const dryRunBoolean = dryRun === 'true'; // defaults to false
    if (!dryRunBoolean && (data.amount === undefined || data.amount <= 0)) {
      throw new HttpException(
        'Amount should be larger than 0 when not using dry run',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.paymentsExecutionService.createPayment({
      userId,
      projectId,
      amount: data.amount,
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

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentCREATE] })
  @ApiOperation({
    summary:
      '[SCOPED] Send payout instruction to fsp to retry a payment. This retries failed payments with the original amount',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @Patch('projects/:projectId/payments')
  public async retryPayment(
    @Body() data: RetryPaymentDto,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<BulkActionResultDto> {
    const userId = RequestHelper.getUserId(req);

    return await this.paymentsExecutionService.retryPayment(
      userId,
      projectId,
      data.paymentId,
      data.referenceIds,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentFspInstructionREAD],
  })
  @ApiOperation({
    summary:
      '[SCOPED] Get payments instructions for past payment to post in Fsp Portal',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Get payments instructions for past payment to post in Fsp Portal - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('projects/:projectId/payments/:paymentId/fsp-instructions')
  public async getFspInstructions(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('paymentId', ParseIntPipe)
    paymentId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<FspInstructions[]> {
    const userId = RequestHelper.getUserId(req);

    return await this.paymentsExcelFspService.getFspInstructions(
      projectId,
      paymentId,
      userId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Gets all transactions for a date range in json (default) or xlsx format',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
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
  // This transaction export controller is located in the payments controller because the transaction modules have no knowledge of projects and registrations
  // We tried to name this controller first 'projects/:projectId/payments/transactions but than it conflicted with the getTransactions route
  @Get('projects/:projectId/transactions')
  public async exportTransactionsUsingDateFilter(
    @Res() res: Response,
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('format') format = 'json',
    @Query('paymentId', new ParseIntPipe({ optional: true }))
    paymentId?: number,
  ): Promise<Response | void> {
    const result =
      await this.paymentsReportingService.exportTransactionsUsingDateFilter({
        projectId,
        fromDateString: fromDate,
        toDateString: toDate,
        paymentId,
      });
    if (format === ExportFileFormat.xlsx) {
      return sendXlsxReponse(result.data, result.fileName, res);
    }
    return res.send(result);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({ summary: '[SCOPED] Get all transactions for this paymentId' })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved transactions',
    type: [GetTransactionResponseDto],
  })
  @Get('projects/:projectId/payments/:paymentId/transactions')
  public async getTransactions(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<GetTransactionResponseDto[]> {
    return await this.paymentsReportingService.getTransactionsByPaymentId({
      projectId,
      paymentId,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({
    summary: 'Get all Payment Events for a Payment.',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return Payment Events by Payment Id.',
    type: [PaymentEventDataDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project or Payment does not exist',
  })
  @Get('projects/:projectId/payments/:paymentId/events')
  public async getPaymentEvents(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Param('paymentId', ParseIntPipe)
    paymentId: number,
  ): Promise<PaymentEventsReturnDto> {
    return this.paymentsReportingService.getPaymentEvents({
      projectId,
      paymentId,
    });
  }
}
