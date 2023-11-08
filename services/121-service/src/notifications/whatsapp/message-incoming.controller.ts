import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminAuthGuard } from '../../guards/admin.guard';
import {
  TwilioIncomingCallbackDto,
  TwilioStatusCallbackDto,
} from '../twilio.dto';
import { MessageIncomingService } from './message-incoming.service';

@UseGuards(AdminAuthGuard)
@ApiTags('notifications')
@Controller('notifications')
export class MessageIncomingController {
  public constructor(
    private readonly messageIncomingService: MessageIncomingService,
  ) {}

  @SkipThrottle()
  @ApiOperation({
    summary: 'Status callback used by Twilio to notify us of WhatsApp status.',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('whatsapp/status')
  public async addWhatsappStatusCallbackToQueue(
    @Body() callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    return await this.messageIncomingService.addWhatsappStatusCallbackToQueue(
      callbackData,
    );
  }

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Status callback used by Twilio to forward incoming messages to us',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('whatsapp/incoming')
  public async handleIncomingWhatsapp(
    @Body() callbackData: TwilioIncomingCallbackDto,
  ): Promise<void> {
    return await this.messageIncomingService.handleIncomingWhatsapp(
      callbackData,
    );
  }

  @SkipThrottle()
  @ApiOperation({
    summary: 'Status callback used by Twilio to notify us of SMS status.',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  // TODO: can this endpoint+method be combind with whatsapp/status, as adding to the queue has the same logic for both?
  @Post('sms/status')
  public async addSmsStatusCallbackToQueue(
    @Body() callbackData: any,
  ): Promise<void> {
    return await this.messageIncomingService.addSmsStatusCallbackToQueue(
      callbackData,
    );
  }
}
