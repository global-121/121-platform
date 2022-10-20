import {
  UseGuards,
  Controller,
  Body,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
import { TransactionsService } from './transactions.service';
import { PermissionEnum } from '../../user/permission.enum';
import { Permissions } from '../../guards/permissions.decorator';
import { PermissionsGuard } from '../../guards/permissions.guard';

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
    name: 'minPayment',
    required: false,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
  })
  @Get('programs/:programId/payments/transactions')
  public async getTransactions(
    @Param('programId') programId: number,
    @Query('minPayment') minPayment: number,
  ): Promise<any> {
    return await this.transactionsService.getTransactions(
      Number(programId),
      false,
      minPayment,
    );
  }

  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ summary: 'Get a single transaction' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
  })
  @Post('programs/:programId/payments/transactions/one')
  public async getTransaction(
    @Param() params,
    @Body() data: GetTransactionDto,
  ): Promise<GetTransactionOutputDto> {
    return await this.transactionsService.getTransaction(
      params.programId,
      data,
    );
  }
}
