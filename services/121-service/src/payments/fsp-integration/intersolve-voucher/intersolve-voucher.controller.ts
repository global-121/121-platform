import {
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

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { IdentifyVoucherDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/identify-voucher.dto';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { IntersolveVoucherCronService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';
import { IMAGE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

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
    @UploadedFile() instructionsFileBlob: Blob,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    await this.intersolveVoucherService.postInstruction(
      programId,
      instructionsFileBlob,
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
