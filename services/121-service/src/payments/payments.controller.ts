import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreatePaymentDto } from '@121-service/src/payments/dto/create-payment.dto';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { GetPaymentAggregationDto } from '@121-service/src/payments/dto/get-payment-aggregration.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { RetryPaymentDto } from '@121-service/src/payments/dto/retry-payment.dto';
import { PaymentsService } from '@121-service/src/payments/payments.service';
import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { PaginateConfigRegistrationViewOnlyFilters } from '@121-service/src/registration/const/filter-operation.const';
import {
  BulkActionResultDto,
  BulkActionResultPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { FILE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Paginate, PaginateQuery, PaginatedSwaggerDocs } from 'nestjs-paginate';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('payments')
@Controller()
export class PaymentsController {
  public constructor(
    private readonly paymentsService: PaymentsService,
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
  ): Promise<any> {
    // TODO: REFACTOR: use a DTO to define stable structure of result body
    return await this.paymentsService.getPayments(programId);
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
    return await this.paymentsService.getProgramPaymentsStatus(programId);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({ summary: '[SCOPED] Get payment aggregate results' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'payment',
    required: true,
    type: 'integer',
    description: 'Request transactions from a specific payment index',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retrieved payment aggregate results - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: PaymentReturnDto,
  })
  @Get('programs/:programId/payments/:payment')
  public async getPaymentAggregation(
    @Param() params: GetPaymentAggregationDto,
  ): Promise<PaymentReturnDto> {
    return await this.paymentsService.getPaymentAggregation(
      Number(params.programId),
      Number(params.payment),
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentCREATE] })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run result for doing a payment - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Doing the payment was succesfully started - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiOperation({
    summary: '[SCOPED] Send payout instruction to financial service provider',
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
    @Req() req,
    @Query() queryParams, // Query decorator can be used in combi with Paginate decorator
  ): Promise<BulkActionResultPaymentDto> {
    const userId = req.user.id;
    await this.registrationsPaginateService.throwIfNoPermissionsForQuery(
      userId,
      programId,
      query,
    );
    const dryRun = queryParams.dryRun === 'true';

    if (!dryRun && (data.amount === undefined || data.amount <= 0)) {
      throw new HttpException(
        'Amount should be larger than 0 when not using dry run',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.paymentsService.postPayment(
      userId,
      programId,
      data.payment,
      data.amount,
      query,
      dryRun,
    );

    if (dryRun) {
      // If dryRun is true the status code is 200 because nothing changed (201) and nothing is going to change (202)
      // I did not find another way to send a different status code than with a HttpException
      throw new HttpException(result, HttpStatus.OK);
    }
    return result;
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentCREATE] })
  @ApiOperation({
    summary:
      '[SCOPED] Send payout instruction to financial service provider to retry a payment. This retries failed payments with the original amount',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch('programs/:programId/payments')
  public async retryPayment(
    @Body() data: RetryPaymentDto,
    @Param('programId', ParseIntPipe) programId: number,
    @Req() req,
  ): Promise<BulkActionResultDto> {
    const userId = req.user.id;
    return await this.paymentsService.retryPayment(
      userId,
      programId,
      data.payment,
      data.referenceIds,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentFspInstructionREAD],
  })
  @ApiOperation({
    summary:
      '[SCOPED] Get payments instructions for past payment to post in Financial Service Provider Portal',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Get payments instructions for past payment to post in Financial Service Provider Portal - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/payments/:payment/fsp-instructions')
  public async getFspInstructions(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('payment', ParseIntPipe)
    payment: number,
    @Req() req,
  ): Promise<FspInstructions> {
    const userId = req.user.id;
    return await this.paymentsService.getFspInstructions(
      programId,
      payment,
      userId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentCREATE] })
  @ApiOperation({
    summary: '[SCOPED] Upload payment reconciliation data from FSP per payment',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Uploaded payment reconciliation data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Post('programs/:programId/payments/:payment/fsp-reconciliation')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async importFspReconciliationData(
    @UploadedFile() file,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('payment', ParseIntPipe)
    payment: number,
    @Req() req,
  ): Promise<ImportResult> {
    const userId = req.user.id;
    return await this.paymentsService.importFspReconciliationData(
      file,
      programId,
      payment,
      userId,
    );
  }
}
