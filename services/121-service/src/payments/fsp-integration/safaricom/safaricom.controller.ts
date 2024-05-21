import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('callbacks/safaricom')
// TODO: REFACTOR: rename to /callbacks/safaricom
@Controller('payments/safaricom')
export class SafaricomController {
  public constructor(private safaricomService: SafaricomService) {}

  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify status of payment to us.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notified' })
  @Post('transaction')
  public async resultCallback(
    @Body() safaricomPaymentResultData: any,
  ): Promise<any> {
    await this.safaricomService.processSafaricomResult(
      safaricomPaymentResultData,
    );
  }
}
