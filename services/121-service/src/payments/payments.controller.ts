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
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('payments')
@Controller('payments')
export class PaymentsController {
  public constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.View, UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Get past payments for program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Get past payments for program',
  })
  @Get(':programId')
  public async getPayments(@Param() params): Promise<any> {
    return await this.paymentsService.getPayments(Number(params.programId));
  }

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({
    title: 'Send payout instruction to financial service provider',
  })
  @Post()
  public async createPayment(
    @Body() data: CreatePaymentDto,
    @User('id') userId: number,
  ): Promise<number> {
    return await this.paymentsService.createPayment(
      userId,
      data.programId,
      data.payment,
      data.amount,
      data.referenceId,
    );
  }
}
