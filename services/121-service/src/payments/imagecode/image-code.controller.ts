import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';

import { ImageCodeService } from '@121-service/src/payments/imagecode/image-code.service';
import { sendImageResponse } from '@121-service/src/utils/send-image-response.helper';

@ApiTags('notifications')
// I am afraid to change this url as it may break already sent WhatsApps
@Controller('notifications/imageCode')
export class ImageCodeController {
  private readonly imageCodeService: ImageCodeService;
  public constructor(imageCodeService: ImageCodeService) {
    this.imageCodeService = imageCodeService;
  }

  @SkipThrottle()
  @ApiOperation({
    summary: 'Get voucher image to include in WhatsApp - called by Twilio',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Collect voucher image via WhatsApp',
  })
  @ApiParam({ name: 'secret' })
  // TODO: rename to /fsps/intersolve-voucher/vouchers/:secret
  @Get(':secret')
  public async get(
    @Param('secret') secret: string,
    @Res() response: Response,
  ): Promise<void> {
    const blob = (await this.imageCodeService.get(secret)) as string;
    sendImageResponse(blob, response);
  }
}
