import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-timeout-callback.dto';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';

@ApiTags('financial-service-providers/safaricom')
@Controller('financial-service-providers/safaricom')
export class SafaricomController {
  public constructor(private safaricomService: SafaricomService) {}

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify status of transfer to us.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notified transfer status',
  })
  @Post('callback')
  public async processTransferCallback(
    @Body() safaricomTransferCallback: SafaricomTransferCallbackDto,
  ): Promise<any> {
    await this.safaricomService.processTransferCallback(
      safaricomTransferCallback,
    );
  }

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify us of timeout on transfer request.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notified of timeout',
  })
  @Post('timeout-callback')
  public async processTransferTimeoutCallback(
    @Body()
    safaricomTransferTimeoutCallback: SafaricomTransferTimeoutCallbackDto,
  ): Promise<any> {
    // Added a logging here just to monitor safaricom callback for payout timeout notification
    console.log(
      'safaricomTransferTimeoutCallback: ',
      JSON.stringify(safaricomTransferTimeoutCallback, null, 2),
    );

    await this.safaricomService.processTransferTimeoutCallback(
      safaricomTransferTimeoutCallback,
    );
  }
}
