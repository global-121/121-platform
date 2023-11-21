import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Admin } from '../../guards/admin.decorator';
import { AdminAuthGuard } from '../../guards/admin.guard';
import { TwilioStatusCallbackDto } from '../twilio.dto';
import { WhatsappService } from './whatsapp.service';

@UseGuards(AdminAuthGuard)
@ApiTags('notifications')
@Controller('notifications/whatsapp')
export class WhatsappController {
  public constructor(private readonly whatsappService: WhatsappService) {}

  @Admin()
  @ApiOperation({
    summary:
      'Tests all the templates of the platform. This API call will take few minutes. Copy paste the sessionId after this call to /notifications/whatsapp/templates/:sessionId to see the results',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Get('templates')
  public async testTemplates(): Promise<object> {
    return await this.whatsappService.testTemplates();
  }

  @SkipThrottle()
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
