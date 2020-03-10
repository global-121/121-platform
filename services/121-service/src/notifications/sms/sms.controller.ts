import { SmsService } from './sms.service';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiResponse, ApiUseTags, ApiImplicitParam } from '@nestjs/swagger';

@ApiUseTags('notifications')
@Controller('notifications/sms')
export class SmsController {
  private readonly smsService: SmsService;
  public constructor(smsService: SmsService) {
    this.smsService = smsService;
  }

  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.smsService.statusCallback(callbackData);
  }
}
