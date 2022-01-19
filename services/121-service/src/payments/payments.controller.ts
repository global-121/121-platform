import { Post, Body, Controller, UseGuards, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { User } from '../user/user.decorator';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { DefaultUserRole } from '../user/user-role.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PermissionsGuard } from '../permissions.guard';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';

@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@ApiUseTags('payments')
@Controller()
export class PaymentsController {
  public constructor(private readonly paymentsService: PaymentsService) {}

  @Permissions(PermissionEnum.PaymentREAD)
  @ApiOperation({ title: 'Get past payments for program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
    title: 'Send payout instruction to financial service provider',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
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
      data.referenceId,
    );
  }

  @Permissions(PermissionEnum.PaymentFspInstructionREAD)
  @ApiOperation({
    title:
      'Get payments instructions for past payment to post in Financial Service Provider Portal',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiImplicitParam({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description:
      'Get payments instructions for past payment to post in Financial Service Provider Portal',
  })
  @Get('programs/:programId/payments/:payment/fsp-instructions')
  public async getFspInstructions(@Param() params): Promise<any> {
    return await this.paymentsService.getFspInstructions(
      Number(params.programId),
      Number(params.payment),
    );
  }
}
