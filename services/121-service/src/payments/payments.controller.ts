import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { ImportResult } from '../registration/dto/bulk-import.dto';
import { FILE_UPLOAD_API_FORMAT } from '../shared/file-upload-api-format';
import { PermissionEnum } from '../user/permission.enum';
import { User } from '../user/user.decorator';
import { CreatePaymentDto, RetryPaymentDto } from './dto/create-payment.dto';
import { FspInstructions } from './dto/fsp-instructions.dto';
import { PaymentsService } from './payments.service';

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
    summary: 'Send payout instructions to financial service providers',
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

  @Permissions(PermissionEnum.PaymentCREATE)
  @ApiOperation({
    summary: 'Send retry payout instructions to financial service providers',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully sent retry payments instructions',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Patch('programs/:programId/payments')
  public async retryPayment(
    @Body() data: RetryPaymentDto,
    @Param() param,
    @User('id') userId: number,
  ): Promise<number> {
    return await this.paymentsService.retryPayment(
      userId,
      param.programId,
      data.payment,
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
  public async getFspInstructions(
    @Param() params,
    @User('id') userId: number,
  ): Promise<FspInstructions> {
    return await this.paymentsService.getFspInstructions(
      Number(params.programId),
      Number(params.payment),
      userId,
    );
  }

  @Permissions(PermissionEnum.PaymentCREATE)
  @ApiOperation({
    summary: 'Upload payment reconciliation data from FSP per payment',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'payment', required: true, type: 'integer' })
  @ApiQuery({ name: 'fspIds', required: true, type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Uploaded payment reconciliation data',
  })
  @Post('programs/:programId/payments/:payment/fsp-reconciliation')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async importFspReconciliationData(
    @UploadedFile() file,
    @Param() params,
    @Query() query,
    @User('id') userId: number,
  ): Promise<ImportResult> {
    return await this.paymentsService.importFspReconciliationData(
      file,
      Number(params.programId),
      Number(params.payment),
      query.fspIds.split(','),
      userId,
    );
  }
}
