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
import { Roles } from '../../roles.decorator';
import { RolesGuard } from '../../roles.guard';
import { DefaultUserRole } from '../../user/user-role.enum';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('payments/transactions')
@Controller()
export class TransactionsController {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  @Roles(
    DefaultUserRole.View,
    DefaultUserRole.RunProgram,
    DefaultUserRole.PersonalData,
  )
  @ApiOperation({ title: 'Get transactions' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiImplicitQuery({
    name: 'minPayment',
    required: false,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Get all transactions',
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

  @Roles(
    DefaultUserRole.View,
    DefaultUserRole.RunProgram,
    DefaultUserRole.PersonalData,
  )
  @ApiOperation({ title: 'Get a single transaction' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Get a single transaction',
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
