import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { AuthenticatedUser } from '../../../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../../../guards/authenticated-user.guard';
import { IMAGE_UPLOAD_API_FORMAT } from '../../../shared/file-upload-api-format';
import { PermissionEnum } from '../../../user/enum/permission.enum';
import { IdentifyVoucherDto } from './dto/identify-voucher.dto';
import { IntersolveVoucherJobDetails } from './dto/job-details.dto';
import { IntersolveVoucherService } from './intersolve-voucher.service';
import { IntersolveVoucherCronService } from './services/intersolve-voucher-cron.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers/intersolve-voucher')
@Controller()
export class IntersolveVoucherController {
  public constructor(
    private intersolveVoucherService: IntersolveVoucherService,
    private intersolveVoucherCronService: IntersolveVoucherCronService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentVoucherREAD] })
  @ApiOperation({
    summary: '[SCOPED] Export Intersolve voucher image',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Voucher exported - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-voucher/vouchers',
  )
  public async exportVouchers(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query() queryParams: IdentifyVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.exportVouchers(
      queryParams.referenceId,
      Number(queryParams.payment),
      programId,
    );
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentVoucherREAD] })
  @ApiOperation({
    summary: '[SCOPED] Get balance of Intersolve voucher',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'payment', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Voucher balance retrieved - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-voucher/vouchers/balance',
  )
  public async getBalance(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query() queryParams: IdentifyVoucherDto,
  ): Promise<number> {
    return await this.intersolveVoucherService.getVoucherBalance(
      queryParams.referenceId,
      Number(queryParams.payment),
      programId,
    );
  }

  @ApiOperation({
    summary:
      'Get intersolve voucher instructions image - used by Twilio to include in WhatsApp message',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get intersolve instructions',
  })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-voucher/instructions',
  )
  public async intersolveInstructions(
    @Res() response: Response,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.getInstruction(programId);
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Post Intersolve instructions-image (Only .png-files supported)',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(IMAGE_UPLOAD_API_FORMAT)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post intersolve instructions',
  })
  @Post(
    'programs/:programId/financial-service-providers/intersolve-voucher/instructions',
  )
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    await this.intersolveVoucherService.postInstruction(
      programId,
      instructionsFileBlob,
    );
  }

  //TODO: mention this in WORKFLOWS?
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Start a job to update all voucher balances of a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Voucher update job started',
  })
  @Post(
    '/programs/:programId/financial-service-providers/intersolve-voucher/batch-jobs',
  )
  public async createJob(
    @Body() jobDetails: IntersolveVoucherJobDetails,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    await this.intersolveVoucherService.updateVoucherBalanceJob(
      programId,
      jobDetails.name,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Cancel by refpos',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vouchers canceled by refpos',
  })
  @Post('/financial-service-providers/intersolve-voucher/cancel')
  public async cancelByRefPos(): Promise<void> {
    console.info('CronjobService - Started: cancelByRefposIntersolve');
    await this.intersolveVoucherCronService.cancelByRefposIntersolve();
    console.info('CronjobService - Complete: cancelByRefposIntersolve');
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Cache unused vouchers',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cached unused vouchers',
  })
  @Post('/financial-service-providers/intersolve-voucher/cache-unused-vouchers')
  public async cacheUnusedVouchers(): Promise<void> {
    console.info('CronjobService - Started: cronCacheUnusedVouchers');
    await this.intersolveVoucherCronService.cacheUnusedVouchers();
    console.info('CronjobService - Complete: cronCacheUnusedVouchers');
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Send WhatsApp reminders',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sent WhatsApp reminders',
  })
  @Post('/financial-service-providers/intersolve-voucher/send-reminders')
  public async sendWhatsappReminders(): Promise<void> {
    console.info('CronjobService - Started: cronSendWhatsappReminders');
    await this.intersolveVoucherCronService.sendWhatsappReminders();
    console.info('CronjobService - Complete: cronSendWhatsappReminders');
  }
}
