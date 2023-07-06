import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SafaricomService } from './safaricom.service';

@ApiTags('payments/safaricom')
@Controller('payments/safaricom')
export class SafaricomController {
  public constructor(private safaricomService: SafaricomService) {}

  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify status of payment to us.',
  })
  @ApiResponse({ status: 201, description: 'Notified' })
  @Post('transaction')
  public async resultCallback(
    @Body() safaricomPaymentResultData: any,
  ): Promise<any> {
    console.log(safaricomPaymentResultData);
    await this.safaricomService.processSafaricomResult(
      safaricomPaymentResultData,
    );
  }
}
