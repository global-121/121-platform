import { AfricasTalkingService } from './africas-talking.service';
import { Post, Body, Controller, Get, Param, Res } from '@nestjs/common';
import { FspService } from './fsp.service';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { IntersolveService } from './intersolve.service';
import { DidDto } from '../program/dto/did.dto';
import { Response } from 'express-serve-static-core';
import stream from 'stream';

@ApiUseTags('fsp')
@Controller('fsp')
export class FspController {
  private readonly fspService: FspService;
  private readonly africasTalkingService: AfricasTalkingService;
  public constructor(
    fspService: FspService,
    africasTalkingService: AfricasTalkingService,
    private intersolveService: IntersolveService,
  ) {
    this.fspService = fspService;
    this.africasTalkingService = africasTalkingService;
  }

  @ApiOperation({ title: 'Get fsp' })
  @ApiImplicitParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Fsp with attributes',
  })
  @Get(':fspId')
  public async getFspById(
    @Param() param,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.getFspById(param.fspId);
  }

  @ApiOperation({
    title:
      'Validation callback used by Africas Talking to request validity of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Validated' })
  @Post('africastalking/validation')
  public async validationCallback(
    @Body() africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<void> {
    return await this.africasTalkingService.africasTalkingValidation(
      africasTalkingValidationData,
    );
  }

  @ApiOperation({
    title:
      'Notification callback used by Africas Talking to notify status of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Notified' })
  @Post('africastalking/notification')
  public async notificationCallback(
    @Body() africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<void> {
    await this.africasTalkingService.africasTalkingNotification(
      africasTalkingNotificationData,
    );
  }

  @ApiOperation({
    title: 'Export Intersolve vouchers',
  })
  @ApiResponse({ status: 200, description: 'Vouchers exported' })
  @Post('intersolve/export-voucher')
  public async exportVouchers(
    @Body() didDto: DidDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveService.exportVouchers(didDto.did);
    var bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(200, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }
}
