import {
  Post,
  Body,
  Controller,
  UseGuards,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { User } from '../user/user.decorator';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
  ApiConsumes,
  ApiImplicitFile,
} from '@nestjs/swagger';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UploadFspReconciliationDto } from './dto/upload-fsp-reconciliation.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportResult } from '../registration/dto/bulk-import.dto';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('payments')
@Controller()
export class PaymentsController {
  public constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.View, UserRole.RunProgram, UserRole.PersonalData)
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

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
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

  @Roles(UserRole.PersonalData)
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

  @Roles(UserRole.PersonalData)
  @ApiOperation({
    title:
      'Upload payment reconciliation data from FSP - for any number of payments at once',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Uploaded payment reconciliation data',
  })
  @Post('programs/:programId/payments/reconciliation')
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true })
  @UseInterceptors(FileInterceptor('file'))
  public async importFspReconciliationData(
    @UploadedFile() csvFile,
    @Param() params,
  ): Promise<any> {
    return await this.paymentsService.importFspReconciliationData(
      csvFile,
      Number(params.programId),
    );
  }
}
