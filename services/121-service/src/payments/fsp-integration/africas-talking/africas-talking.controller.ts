import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AfricasTalkingService } from './africas-talking.service';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';

@ApiTags('payments/africas-talking')
@Controller('payments/africas-talking')
export class AfricasTalkingController {
  public constructor(private africasTalkingService: AfricasTalkingService) {}

  @ApiOperation({
    summary:
      'Validation callback used by Africas Talking to request validity of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Validated' })
  @Post('validation')
  public async validationCallback(
    @Body() africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<void> {
    return await this.africasTalkingService.checkValidation(
      africasTalkingValidationData,
    );
  }

  @ApiOperation({
    summary:
      'Notification callback used by Africas Talking to notify status of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Notified' })
  @Post('notification')
  public async notificationCallback(
    @Body() africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<void> {
    await this.africasTalkingService.processTransactionStatus(
      africasTalkingNotificationData,
    );
  }
}
