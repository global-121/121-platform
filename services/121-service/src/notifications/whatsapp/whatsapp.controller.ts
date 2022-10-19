import { WhatsappService } from './whatsapp.service';
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  TwilioStatusCallbackDto,
  TwilioIncomingCallbackDto,
} from '../twilio.dto';
import { Admin } from '../../guards/admin.decorator';
import { AdminAuthGuard } from '../../guards/admin.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';

@UseGuards(AdminAuthGuard)
@ApiTags('notifications')
@Controller('notifications/whatsapp')
export class WhatsappController {
  private readonly whatsappService: WhatsappService;
  public constructor(whatsappService: WhatsappService) {
    this.whatsappService = whatsappService;
  }

  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('status')
  public async statusCallback(
    @Body() callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    return await this.whatsappService.statusCallback(callbackData);
  }

  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('incoming')
  public async incoming(
    @Body() callbackData: TwilioIncomingCallbackDto,
  ): Promise<void> {
    return await this.whatsappService.handleIncoming(callbackData);
  }

  @Admin()
  @ApiOperation({
    summary:
      'Tests all the templates of the platform. Copy paste the sessionId after this call to /notifications/whatsapp/templates/:sessionId to see the results',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Get('templates')
  public async testTemplates(): Promise<object> {
    return await this.whatsappService.testTemplates();
  }

  @ApiOperation({
    summary:
      'Url for callbacks from Twilio triggered by a GET request to /notifications/whatsapp/templates',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('templates')
  public async storeTemplateTestResult(
    @Body() callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    return await this.whatsappService.storeTemplateTestResult(callbackData);
  }

  @Admin()
  @ApiOperation({
    summary:
      'Show results of tests the templates of the platform. Insert the sessionId you got from a GET request to /notifications/whatsapp/templates',
  })
  @ApiParam({ name: 'sessionId', required: true, type: 'string' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Get('templates/:sessionId')
  public async getWhatsappTemplateResult(@Param() param): Promise<object> {
    return await this.whatsappService.getWhatsappTemplateResult(
      param.sessionId,
    );
  }
}
