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
import { PermissionEnum } from '../../user/enum/permission.enum';
import { AuditedTransactionReturnDto } from './dto/get-transaction.dto';
import { TransactionsService } from './transactions.service';

@UseGuards(PermissionsGuard)
@ApiTags('transactions')
@Controller()
export class TransactionsController {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ summary: '[SCOPED] Get all transactions' })
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
    type: [AuditedTransactionReturnDto],
  })
  @Get('programs/:programId/transactions')
  public async getTransactions(
    @Param('programId') programId: number,
    @Query('referenceId') referenceId: string,
    @Query('payment') payment: number,
  ): Promise<AuditedTransactionReturnDto[]> {
    return await this.transactionsService.getAuditedTransactions(
      Number(programId),
      Number(payment),
      referenceId,
    );
  }
}
