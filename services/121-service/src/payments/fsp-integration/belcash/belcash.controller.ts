import { BelcashService } from '@121-service/src/payments/fsp-integration/belcash/belcash.service';
import { BelcashPaymentStatusDto } from '@121-service/src/payments/fsp-integration/belcash/dto/belcash-payment-status.dto';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('callbacks/belcash')
// TODO: REFACTOR: rename to callbacks/belcash
@Controller('payments/belcash')
export class BelcashController {
  public constructor(private belcashService: BelcashService) {}

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Notification callback used by Belcash to notify status of payment to us.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notified' })
  @Post('payment-status')
  public async notificationCallback(
    @Body() belcashCallbackData: BelcashPaymentStatusDto,
  ): Promise<void> {
    await this.belcashService.processTransactionStatus(belcashCallbackData);
  }
}
