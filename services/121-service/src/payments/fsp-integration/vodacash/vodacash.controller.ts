import { Post, Body, Controller, UseGuards } from '@nestjs/common';
import { ApiUseTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { VodacashPaymentStatusDto } from './dto/vodacash-payment-status.dto';
import { VodacashService } from './vodacash.service';

@ApiUseTags('payments/vodacash')
@Controller('payments/vodacash')
export class VodacashController {
  public constructor(private vodacashService: VodacashService) {}

  @ApiOperation({
    title:
      'Notification callback used by Vodacash to notify status of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Notified' })
  @Post('payment-status')
  public async notificationCallback(
    @Body() vodacashCallbackData: VodacashPaymentStatusDto,
  ): Promise<void> {
    await this.vodacashService.processTransactionStatus(vodacashCallbackData);
  }
}
