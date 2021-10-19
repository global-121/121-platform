import {
  Post,
  Body,
  Controller,
  UseGuards,
  forwardRef,
  Inject,
} from '@nestjs/common';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { fspName } from '../../fsp/financial-service-provider.entity';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { RolesGuard } from '../../roles.guard';
import { PaymentsService } from '../payments.service';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('payments/africas-talking')
@Controller('payments/africas-talking')
export class AfricasTalkingController {
  public constructor(
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  @ApiOperation({
    title:
      'Validation callback used by Africas Talking to request validity of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Validated' })
  @Post('africastalking/validation')
  public async validationCallback(
    @Body() africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<void> {
    return await this.paymentsService.checkPaymentValidation(
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
    await this.paymentsService.processPaymentStatus(
      fspName.africasTalking,
      africasTalkingNotificationData,
    );
  }
}
