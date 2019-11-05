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
  public sendSms(): void {
    return this.smsService.sendSms(
      'Meer Smsjes is meer beter',
      '+0031600000000',
    );
  }
  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.smsService.statusCallback(callbackData);
  }
}
