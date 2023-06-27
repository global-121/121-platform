import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SafaricomPaymentStatusDto } from './dto/safaricom-payment-status.dto';
import { SafaricomService } from './safaricom.service';

@ApiTags('payments/safaricom')
@Controller('payments/safaricom')
export class SafaricomController {
  public constructor(private safaricomService: SafaricomService) {}

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify status of payment to us.',
  })
  @ApiResponse({ status: 201, description: 'Notified' })
  @Post('payment-status')
  public async notificationCallback(
    @Body() safaricomCallbackData: SafaricomPaymentStatusDto,
  ): Promise<void> {
    await this.safaricomService.processTransactionStatus(safaricomCallbackData);
  }
}
