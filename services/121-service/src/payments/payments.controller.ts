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
import { Paginate, PaginatedSwaggerDocs, PaginateQuery } from 'nestjs-paginate';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import { PaginateConfigRegistrationViewOnlyFilters } from '../registration/const/filter-operation.const';
import {
  BulkActionResultDto,
  BulkActionResultPaymentDto,
} from '../registration/dto/bulk-action-result.dto';
import { ImportResult } from '../registration/dto/bulk-import.dto';
import { RegistrationViewEntity } from '../registration/registration-view.entity';
import { RegistrationsPaginationService } from '../registration/services/registrations-pagination.service';
import { FILE_UPLOAD_API_FORMAT } from '../shared/file-upload-api-format';
import { PermissionEnum } from '../user/enum/permission.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FspInstructions } from './dto/fsp-instructions.dto';
import { GetPaymentAggregationDto } from './dto/get-payment-aggregration.dto';
import { ProgramPaymentsStatusDto } from './dto/program-payments-status.dto';
import { RetryPaymentDto } from './dto/retry-payment.dto';
import { PaymentsService } from './payments.service';
import { PaymentReturnDto } from './transactions/dto/get-transaction.dto';

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
    status: 200,
    description: 'Get past payments for program',
  })
  @Get('programs/:programId/payments')
  public async getPayments(@Param() params): Promise<any> {
    // TODO: REFACTOR: use a DTO to define stable structure of result body
    return await this.paymentsService.getPayments(Number(params.programId));
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({ summary: 'Get current status of all payments for program. ' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Status of all payments for program',
  })
  @Get('programs/:programId/payments/status')
  public async getPaymentStatus(
    @Param() params,
  ): Promise<ProgramPaymentsStatusDto> {
    return await this.paymentsService.getProgramPaymentsStatus(
      Number(params.programId),
    );
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
    status: 200,
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
    status: 200,
    description:
      'Dry run result for doing a payment - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: BulkActionResultDto,
  })
  @ApiResponse({
    status: 202,
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

    if (!dryRun && !(data.amount > 0)) {
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
    status: 200,
    description:
      'Get payments instructions for past payment to post in Financial Service Provider Portal - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/payments/:payment/fsp-instructions')
  public async getFspInstructions(
    @Param() params,
    @Req() req,
  ): Promise<FspInstructions> {
    const userId = req.user.id;
    return await this.paymentsService.getFspInstructions(
      Number(params.programId),
      Number(params.payment),
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
    status: 201,
    description:
      'Uploaded payment reconciliation data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Post('programs/:programId/payments/:payment/fsp-reconciliation')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async importFspReconciliationData(
    @UploadedFile() file,
    @Param() params,
    @Req() req,
  ): Promise<ImportResult> {
    const userId = req.user.id;
    return await this.paymentsService.importFspReconciliationData(
      file,
      Number(params.programId),
      Number(params.payment),
      userId,
    );
  }
}
