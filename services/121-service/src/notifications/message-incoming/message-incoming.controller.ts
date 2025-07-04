import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import {
  TwilioIncomingCallbackDto,
  TwilioStatusCallbackDto,
} from '@121-service/src/notifications/twilio.dto';
import { AnyValidBody } from '@121-service/src/registration/validators/any-valid-body.validator';

@UseGuards(AuthenticatedUserGuard)
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
    @AnyValidBody() callbackData: TwilioStatusCallbackDto, // We cannot control the structure of the callback data, so we use AnyValidBody
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
    @AnyValidBody() callbackData: TwilioIncomingCallbackDto, // We cannot control the structure of the callback data, so we use AnyValidBody
  ): Promise<void> {
    return await this.messageIncomingService.addIncomingWhatsappToQueue(
      callbackData,
    );
  }

  @SkipThrottle()
  @ApiOperation({
    summary: 'Status callback used by Twilio to notify us of SMS status.',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('sms/status')
  public async addSmsStatusCallbackToQueue(
    @AnyValidBody() callbackData: TwilioStatusCallbackDto, // We cannot control the structure of the callback data, so we use AnyValidBody
  ): Promise<void> {
    return await this.messageIncomingService.addSmsStatusCallbackToQueue(
      callbackData,
    );
  }
}
