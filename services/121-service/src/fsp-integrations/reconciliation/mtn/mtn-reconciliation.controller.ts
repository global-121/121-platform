import { Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { MtnTransferCallbackDto } from '@121-service/src/fsp-integrations/reconciliation/mtn/dtos/mtn-transfer-callback.dto';
import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { NoUserAuthenticationController } from '@121-service/src/guards/no-user-authentication.decorator';
import { AnyValidBody } from '@121-service/src/registration/validators/any-valid-body.validator';

@ApiTags('fsps/mtn')
@Controller('fsps/mtn')
@NoUserAuthenticationController(
  'Called by MTN. Notification of transfer status, based on unique reference-id.',
)
export class MtnReconciliationController {
  public constructor(
    private readonly mtnReconciliationService: MtnReconciliationService,
  ) {}

  @SkipThrottle()
  @ApiOperation({
    summary: 'Used by MTN to notify us of the status of a transfer.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notified transfer status',
  })
  @ApiBody({ type: MtnTransferCallbackDto })
  @Post('transfer-callback')
  public async processTransferCallback(
    @AnyValidBody() mtnTransferCallback: MtnTransferCallbackDto,
  ): Promise<void> {
    await this.mtnReconciliationService.processTransferCallback(
      mtnTransferCallback,
    );
    console.log('mtnTransferCallback: ', mtnTransferCallback);
  }
}
