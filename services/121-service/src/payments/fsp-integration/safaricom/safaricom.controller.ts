import { SafaricomTransferCallbackJobDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback-job.dto';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

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
  public async processSafaricomCallback(
    @Body() safaricomPaymentResultData: any,
  ): Promise<any> {
    // Prepare the safaricom transfer callback job from callback data
    const safaricomTransferCallbackJob: SafaricomTransferCallbackJobDto = {
      originatorConversationId:
        safaricomPaymentResultData.Result.OriginatorConversationID,
      mpesaConversationId: safaricomPaymentResultData.Result.ConversationID,
      mpesaTransactionId: safaricomPaymentResultData.Result.TransactionID,
      resultCode: safaricomPaymentResultData.Result.ResultCode,
      resultDescription: safaricomPaymentResultData.Result.ResultDesc,
    };

    await this.safaricomService.processSafaricomCallback(
      safaricomTransferCallbackJob,
    );
  }
}
