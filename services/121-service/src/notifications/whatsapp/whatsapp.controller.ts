import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { TwilioStatusCallbackDto } from '@121-service/src/notifications/twilio.dto';
import { WhatsappService } from '@121-service/src/notifications/whatsapp/whatsapp.service';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('notifications')
@Controller('notifications/whatsapp')
export class WhatsappController {
  public constructor(private readonly whatsappService: WhatsappService) {}

  @AuthenticatedUser({ isAdmin: true })
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

  @AuthenticatedUser({ isAdmin: true })
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
