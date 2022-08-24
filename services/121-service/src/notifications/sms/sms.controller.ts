import { SmsService } from './sms.service';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications/sms')
export class SmsController {
  private readonly smsService: SmsService;
  public constructor(smsService: SmsService) {
    this.smsService = smsService;
  }

  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.smsService.statusCallback(callbackData);
  }
}
