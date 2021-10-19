import { Post, Body, Controller, UseGuards } from '@nestjs/common';
import { FspService } from './fsp.service';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { fspName } from './financial-service-provider.entity';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { RolesGuard } from '../roles.guard';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('fsp')
@Controller('fsp')
export class FspController {
  private readonly fspService: FspService;
  public constructor(fspService: FspService) {
    this.fspService = fspService;
  }

  @ApiOperation({
    title:
      'Validation callback used by Africas Talking to request validity of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Validated' })
  @Post('africastalking/validation')
  public async validationCallback(
    @Body() africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<void> {
    return await this.fspService.checkPaymentValidation(
      fspName.africasTalking,
      africasTalkingValidationData,
    );
  }

  @ApiOperation({
    title:
      'Notification callback used by Africas Talking to notify status of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Notified' })
  @Post('africastalking/notification')
  public async notificationCallback(
    @Body() africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<void> {
    await this.fspService.processPaymentStatus(
      fspName.africasTalking,
      africasTalkingNotificationData,
    );
  }
}
