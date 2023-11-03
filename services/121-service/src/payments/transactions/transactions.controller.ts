import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../guards/permissions.decorator';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { PermissionEnum } from '../../user/permission.enum';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
  PaymentReturnDto,
  TransactionReturnDto,
} from './dto/get-transaction.dto';
import { TransactionsService } from './transactions.service';

@UseGuards(PermissionsGuard)
@ApiTags('payments/transactions')
@Controller()
export class TransactionsController {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({
    name: 'payment',
    required: false,
    type: 'integer',
    description: 'Request transactions from a specific payment index',
  })
  @ApiQuery({
    name: 'referenceId',
    required: false,
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Retrieved transactions',
    type: [TransactionReturnDto],
  })
  @Get('programs/:programId/payments/transactions')
  public async getTransactions(
    @Param('programId') programId: number,
    @Query('referenceId') referenceId: string,
    @Query('payment') payment: number,
  ): Promise<TransactionReturnDto[]> {
    return await this.transactionsService.getLastTransactions(
      Number(programId),
      Number(payment),
      referenceId,
    );
  }

  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ summary: 'Get payment aggregate results' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({
    name: 'payment',
    required: true,
    type: 'integer',
    description: 'Request transactions from a specific payment index',
  })
  @ApiResponse({
    status: 200,
    description: 'Retrieved payment aggregate results',
    type: PaymentReturnDto,
  })
  // NOTE this endpoint must be below GET /payments/transactions to avoid endpoint confusion
  @Get('programs/:programId/payments/:payment')
  public async getPaymentAggregation(
    @Param('programId') programId: number,
    @Query('payment') payment: number,
  ): Promise<PaymentReturnDto> {
    return await this.transactionsService.getPaymentAggregation(
      Number(programId),
      Number(payment),
    );
  }

  // TODO: REFACTOR combine this endpoint with GET /payments/transactions (or remove the need for this one altogether)
  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ summary: 'Get a single transaction' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'payment', required: true, type: 'integer' })
  @ApiQuery({ name: 'customDataKey', required: false, type: 'string' })
  @ApiQuery({ name: 'customDataValue', required: false, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Retrieved single transaction',
    type: GetTransactionOutputDto,
  })
  @Get('programs/:programId/payments/transactions/one')
  public async getTransaction(
    @Param() params,
    @Query() queryParams: GetTransactionDto,
  ): Promise<GetTransactionOutputDto> {
    return await this.transactionsService.getTransaction(
      params.programId,
      queryParams,
    );
  }
}
