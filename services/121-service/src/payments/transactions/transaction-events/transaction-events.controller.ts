import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { PaymentEventDataDto } from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('transaction-events')
@Controller()
export class TransactionEventsController {
  public constructor(
    private readonly transactionEventsService: TransactionEventsService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentTransactionREAD] })
  @ApiOperation({
    summary: 'Get all events for a transaction.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'transactionId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return Transaction Events by Transaction Id.',
    type: [PaymentEventDataDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program or Payment or Transaction does not exist',
  })
  @Get('programs/:programId/transactions/:transactionId/events')
  public async getTransactionEvents(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('transactionId', ParseIntPipe)
    transactionId: number,
  ): Promise<TransactionEventsReturnDto> {
    return await this.transactionEventsService.getEventsByTransactionId(
      programId,
      transactionId,
    );
  }
}
