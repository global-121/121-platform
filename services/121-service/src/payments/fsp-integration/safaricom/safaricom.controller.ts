import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('financial-service-providers/safaricom')
@Controller('financial-service-providers/safaricom')
export class SafaricomController {
  public constructor(private safaricomService: SafaricomService) {}

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify status of transfer to us.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notified' })
  @Post('callback')
  public async processTransferCallback(
    @Body() safaricomTransferCallback: SafaricomTransferCallbackDto,
  ): Promise<any> {
    await this.safaricomService.processTransferCallback(
      safaricomTransferCallback,
    );
  }
}
