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
  TransactionReturnDto,
} from './dto/get-transaction.dto';
import { TransactionsService } from './transactions.service';

@UseGuards(PermissionsGuard)
@ApiTags('transactions')
@Controller()
export class TransactionsController {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ summary: '(SCOPED) Get all transactions' })
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
  @Get('programs/:programId/transactions')
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

  // TODO: REFACTOR combine this endpoint with GET /payments/transactions (or remove the need for this one altogether)
  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ summary: '(SCOPED) Get a single transaction' })
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
  @Get('programs/:programId/transactions/one')
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
