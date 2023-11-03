import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminAuthGuard } from '../../guards/admin.guard';
import {
  TwilioIncomingCallbackDto,
  TwilioStatusCallbackDto,
} from '../twilio.dto';
import { WhatsappIncomingService } from './whatsapp-incoming.service';

@UseGuards(AdminAuthGuard)
@ApiTags('notifications')
@Controller('notifications/whatsapp')
export class WhatsappIncomingController {
  public constructor(
    private readonly whatsappIncomingService: WhatsappIncomingService,
  ) {}

  @SkipThrottle()
  @ApiOperation({
    summary: 'Status callback used by Twilio to notify us of WhatsApp status.',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('status')
  public async statusCallback(
    @Body() callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    return await this.whatsappIncomingService.statusCallback(callbackData);
  }

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Status callback used by Twilio to forward incoming messages to us',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('incoming')
  public async incoming(
    @Body() callbackData: TwilioIncomingCallbackDto,
  ): Promise<void> {
    return await this.whatsappIncomingService.handleIncoming(callbackData);
  }
}
