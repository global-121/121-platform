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
  ApiImplicitParam,
  ApiImplicitQuery,
  ApiOperation,
  ApiResponse,
  ApiUseTags,
} from '@nestjs/swagger';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
import { TransactionsService } from './transactions.service';
import { PermissionsGuard } from '../../permissions.guard';
import { Permissions } from '../../permissions.decorator';
import { PermissionEnum } from '../../user/permission.enum';

@UseGuards(PermissionsGuard)
@ApiUseTags('payments/transactions')
@Controller()
export class TransactionsController {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  @Permissions(PermissionEnum.PaymentTransactionREAD)
  @ApiOperation({ title: 'Get all transactions' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiImplicitQuery({
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
  @ApiOperation({ title: 'Get a single transaction' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
