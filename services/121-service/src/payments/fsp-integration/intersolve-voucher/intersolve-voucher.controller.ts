import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
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
import { Response } from 'express';
import stream from 'stream';
import { Admin } from '../../../guards/admin.decorator';
import { AdminAuthGuard } from '../../../guards/admin.guard';
import { Permissions } from '../../../guards/permissions.decorator';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { IMAGE_UPLOAD_API_FORMAT } from '../../../shared/file-upload-api-format';
import { PermissionEnum } from '../../../user/permission.enum';
import { IdentifyVoucherDto } from './dto/identify-voucher.dto';
import { IntersolveVoucherJobDetails } from './dto/job-details.dto';
import { IntersolveVoucherService } from './intersolve-voucher.service';
import { IntersolveVoucherCronService } from './services/intersolve-voucher-cron.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('financial-service-providers/intersolve-voucher')
@Controller()
export class IntersolveVoucherController {
  public constructor(
    private intersolveVoucherService: IntersolveVoucherService,
    private intersolveVoucherCronService: IntersolveVoucherCronService,
  ) {}

  @Permissions(PermissionEnum.PaymentVoucherREAD)
  @ApiOperation({
    summary: '(SCOPED) Export Intersolve voucher image',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description:
      'Voucher exported - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-voucher/vouchers',
  )
  public async exportVouchers(
    @Param() params,
    @Query() queryParams: IdentifyVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.exportVouchers(
      queryParams.referenceId,
      Number(queryParams.payment),
      params.programId,
    );
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @Permissions(PermissionEnum.PaymentVoucherREAD)
  @ApiOperation({
    summary: '(SCOPED) Get balance of Intersolve voucher',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description:
      'Voucher balance retrieved - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-voucher/vouchers/balance',
  )
  public async getBalance(
    @Param() params,
    @Query() queryParams: IdentifyVoucherDto,
  ): Promise<number> {
    return await this.intersolveVoucherService.getVoucherBalance(
      queryParams.referenceId,
      Number(queryParams.payment),
      params.programId,
    );
  }

  @ApiOperation({
    summary:
      'Get intersolve voucher instructions image - used by Twilio to include in WhatsApp message',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 200, description: 'Get intersolve instructions' })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-voucher/instructions',
  )
  public async intersolveInstructions(
    @Res() response: Response,
    @Param() params,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.getInstruction(
      Number(params.programId),
    );
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @Admin()
  @ApiOperation({
    summary: 'Post Intersolve instructions-image (Only .png-files supported)',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(IMAGE_UPLOAD_API_FORMAT)
  @ApiResponse({ status: 201, description: 'Post intersolve instructions' })
  @Post(
    'programs/:programId/financial-service-providers/intersolve-voucher/instructions',
  )
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob,
    @Param() params,
  ): Promise<void> {
    await this.intersolveVoucherService.postInstruction(
      Number(params.programId),
      instructionsFileBlob,
    );
  }

  //TODO: mention this in WORKFLOWS?
  @Admin()
  @ApiOperation({
    summary: 'Start a job to update all voucher balances of a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 201, description: 'Voucher update job started' })
  @Post(
    '/programs/:programId/financial-service-providers/intersolve-voucher/batch-jobs',
  )
  public async createJob(
    @Body() jobDetails: IntersolveVoucherJobDetails,
    @Param() param,
  ): Promise<void> {
    await this.intersolveVoucherService.updateVoucherBalanceJob(
      Number(param.programId),
      jobDetails.name,
    );
  }

  @Admin()
  @ApiOperation({
    summary: '(CRON) Cancel by refpos',
  })
  @ApiResponse({ status: 201, description: 'Vouchers canceled by refpos' })
  @Post('/financial-service-providers/intersolve-voucher/cancel')
  public async cancelByRefPos(): Promise<void> {
    await this.intersolveVoucherCronService.cancelByRefposIntersolve();
  }

  @Admin()
  @ApiOperation({
    summary: '(CRON) Cache unused vouchers',
  })
  @ApiResponse({ status: 201, description: 'Cached unused vouchers' })
  @Post('/financial-service-providers/intersolve-voucher/cache-unused-vouchers')
  public async cacheUnusedVouchers(): Promise<void> {
    await this.intersolveVoucherCronService.cacheUnusedVouchers();
  }

  @Admin()
  @ApiOperation({
    summary: '(CRON) Send WhatsApp reminders',
  })
  @ApiResponse({ status: 201, description: 'Sent WhatsApp reminders' })
  @Post('/financial-service-providers/intersolve-voucher/send-reminders')
  public async sendWhatsappReminders(): Promise<void> {
    await this.intersolveVoucherCronService.sendWhatsappReminders();
  }
}
