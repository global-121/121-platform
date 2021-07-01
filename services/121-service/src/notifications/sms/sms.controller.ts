import { SmsService } from './sms.service';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiResponse,
  ApiUseTags,
  ApiImplicitParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserRole } from '../../user-role.enum';
import { Roles } from '../../roles.decorator';
import { PaStatus } from '../../models/pa-status.model';

@ApiUseTags('notifications')
@Controller('notifications/sms')
export class SmsController {
  private readonly smsService: SmsService;
  public constructor(smsService: SmsService) {
    this.smsService = smsService;
  }

  @Roles(UserRole.Admin)
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
      1,
      null,
      PaStatus.registered,
    );
  }

  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('status')
  public async statusCallback(@Body() callbackData: any): Promise<void> {
    return await this.smsService.statusCallback(callbackData);
  }
}
