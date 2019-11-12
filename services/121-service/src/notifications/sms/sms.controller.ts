import { VoiceService } from './../voice/voice.service';
import { SmsService } from './sms.service';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiResponse, ApiUseTags, ApiImplicitParam } from '@nestjs/swagger';

@ApiUseTags('notifications')
@Controller('sms')
export class SmsController {
  private readonly smsService: SmsService;
  public constructor(smsService: SmsService) {
    this.smsService = smsService;
  }

  @ApiResponse({
    status: 200,
    description: 'Test controller to test sending sms',
  })
  @ApiImplicitParam({ name: 'number' })
  @Get(':number')
  public async sendSms(@Param() params): Promise<void> {
    return await this.smsService.notifyBySms(
      params.number,
      'en',
      'included',
      1,
    );
  }

  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.smsService.statusCallback(callbackData);
  }
}
