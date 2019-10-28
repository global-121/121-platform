import { SmsService } from './sms.service';
import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

@Controller('sms')
export class SmsController {
  private readonly smsService: SmsService;
  public constructor(smsService: SmsService){
    this.smsService = smsService;
  }


  @ApiResponse({ status: 200, description: 'Sms' })
  @Get()
  public sendSms(): void {
    return this.smsService.sendSms();
  }
}
