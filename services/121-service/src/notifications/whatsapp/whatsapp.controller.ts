import { WhatsappService } from './whatsapp.service';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiResponse, ApiUseTags, ApiImplicitParam } from '@nestjs/swagger';
import { UserRole } from '../../user-role.enum';
import { Roles } from '../../roles.decorator';
import { PaStatus } from '../../models/pa-status.model';
import { TwilioStatusCallbackDto } from '../twilio.dto';

@ApiUseTags('notifications')
@Controller('notifications/whatsapp')
export class WhatsappController {
  private readonly whatsappService: WhatsappService;
  public constructor(whatsappService: WhatsappService) {
    this.whatsappService = whatsappService;
  }

  @Roles(UserRole.Admin)
  @ApiResponse({
    status: 200,
    description: 'Test controller to test sending whatsapp',
  })
  @ApiImplicitParam({ name: 'number' })
  @Get(':number')
  public async sendWhatsapp(@Param() params): Promise<void> {
    return await this.whatsappService.notifyByWhatsapp(
      params.number,
      'en',
      1,
      null,
      PaStatus.registered,
    );
  }

  @Post('status')
  public async statusCallback(
    @Body() callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    return await this.whatsappService.statusCallback(callbackData);
  }

  @Post('incoming')
  public async incoming(@Body() callbackData: any): Promise<void> {
    return await this.whatsappService.handleIncoming(callbackData);
  }
}
