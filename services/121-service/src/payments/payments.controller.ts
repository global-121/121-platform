import { Post, Body, Controller, UseGuards, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { User } from '../user/user.decorator';
import { ApiTags, ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';
import { FspInstructions } from './dto/fsp-instructions.dto';

@UseGuards(PermissionsGuard)
@ApiTags('payments')
@Controller()
export class PaymentsController {
  public constructor(private readonly paymentsService: PaymentsService) {}

  @Permissions(PermissionEnum.PaymentREAD)
  @ApiOperation({ summary: 'Get past payments for program' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Get past payments for program',
  })
  @Get('programs/:programId/payments')
  public async getPayments(@Param() params): Promise<any> {
    return await this.paymentsService.getPayments(Number(params.programId));
  }

  @Permissions(PermissionEnum.PaymentCREATE)
  @ApiOperation({
    summary: 'Send payout instruction to financial service provider',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post('programs/:programId/payments')
  public async createPayment(
    @Body() data: CreatePaymentDto,
    @Param() param,
    @User('id') userId: number,
  ): Promise<number> {
    return await this.paymentsService.createPayment(
      userId,
      param.programId,
      data.payment,
      data.amount,
      data.referenceIds,
    );
  }

  @Permissions(PermissionEnum.PaymentFspInstructionREAD)
  @ApiOperation({
    summary:
      'Get payments instructions for past payment to post in Financial Service Provider Portal',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description:
      'Get payments instructions for past payment to post in Financial Service Provider Portal',
  })
  @Get('programs/:programId/payments/:payment/fsp-instructions')
  public async getFspInstructions(@Param() params): Promise<FspInstructions> {
    return await this.paymentsService.getFspInstructions(
      Number(params.programId),
      Number(params.payment),
    );
  }
}
