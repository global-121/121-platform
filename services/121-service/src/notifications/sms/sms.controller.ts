import { VoiceService } from './../voice/voice.service';
import { SmsService } from './sms.service';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiResponse, ApiUseTags } from '@nestjs/swagger';

@ApiUseTags('sms')
@Controller('sms')
export class SmsController {
  private readonly smsService: SmsService;
  public constructor(smsService: SmsService) {
    this.smsService = smsService;
  }

  @ApiResponse({ status: 200, description: 'Test controller to test sending sms' })
  @Get()
  public async sendSms(): Promise<void> {
    return await this.smsService.notifyBySms(
      '+0031600000000',
      'en',
      'included',
      1
    );
  }

  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.smsService.statusCallback(callbackData);
  }
}
