import { SmsService } from './sms.service';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiResponse,
  ApiUseTags,
  ApiImplicitParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { DefaultUserRole } from '../../user/user-role.enum';
import { Roles } from '../../roles.decorator';
import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';

@ApiUseTags('notifications')
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
