import { Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { OnafriqApiWebhookSubscribeResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-webhook-subscribe-response-body.dto';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/onafriq')
@Controller()
export class OnafriqController {
  public constructor(private onafriqService: OnafriqService) {}

  // NOTE: This endpoint is not tested via API-tests, as it is only used one-off in production. If it breaks, it can be fixed manually.
  @AuthenticatedUser({
    isAdmin: true,
  })
  @ApiOperation({
    summary:
      'Set callback URL for Onafriq to send transaction status updates to us. The exact callback URL is set in code, not here. In MOCK mode, this endpoint does nothing.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Webhook subscribed or updated successfully',
  })
  @Post('fsps/onafriq/webhook/subscribe')
  public async subscribeWebhook(): Promise<
    OnafriqApiWebhookSubscribeResponseBody | undefined
  > {
    return await this.onafriqService.subscribeWebhook();
  }
}
