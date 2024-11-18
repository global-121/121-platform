import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { SafaricomPaymentResult } from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-load-response.dto';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';

@ApiTags('callbacks/safaricom')
// TODO: REFACTOR: rename to /callbacks/safaricom
@Controller('payments/safaricom')
export class SafaricomController {
  public constructor(private safaricomService: SafaricomService) {}

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify status of payment to us.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notified' })
  @Post('transaction')
  public async resultCallback(
    @Body() safaricomPaymentResultData: SafaricomPaymentResult,
  ): Promise<void> {
    await this.safaricomService.processSafaricomResult(
      safaricomPaymentResultData,
    );
  }
}
