import {
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { OnafriqApiWebhookSubscribeResponseBody } from '@121-service/src/fsp-integrations/integrations/onafriq/dtos/onafriq-api/onafriq-api-webhook-subscribe-response-body.dto';
import { OnafriqService } from '@121-service/src/fsp-integrations/integrations/onafriq/services/onafriq.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

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
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Webhook subscribed or updated successfully',
  })
  @Post('fsps/onafriq/webhook/subscribe/programs/:programId')
  public async subscribeWebhook(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<OnafriqApiWebhookSubscribeResponseBody | undefined> {
    return await this.onafriqService.subscribeWebhook(programId);
  }
}
