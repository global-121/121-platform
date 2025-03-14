import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { AuditedTransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('transactions')
@Controller()
export class TransactionsController {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  // TODO: Remove this endpoint when the old portal has been deprecated.
  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
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
    status: HttpStatus.OK,
    description: 'Retrieved transactions',
    type: [AuditedTransactionReturnDto],
  })
  @Get('programs/:programId/transactions')
  public async getTransactions(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query('referenceId') referenceId: string,
    @Query('payment') payment: number,
  ): Promise<AuditedTransactionReturnDto[]> {
    return await this.transactionsService.getAuditedTransactions(
      programId,
      Number(payment),
      referenceId,
    );
  }
}
