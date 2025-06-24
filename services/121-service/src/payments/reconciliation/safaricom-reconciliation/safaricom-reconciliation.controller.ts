import {
  BadRequestException,
  Controller,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-timeout-callback.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/dtos/safaricom-transfer-callback.dto';
import { SafaricomReconciliationService } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/safaricom-reconciliation.service';
import { AnyValidBody } from '@121-service/src/registration/validators/any-valid-body.validator';

@ApiTags('fsps/safaricom')
@Controller('fsps/safaricom')
@Controller()
export class SafaricomReconciliationController {
  public constructor(
    private safaricomReconciliationService: SafaricomReconciliationService,
  ) {}

  @SkipThrottle()
  @ApiOperation({
    summary:
      'Notification callback used by Safaricom to notify status of transfer to us.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notified transfer status',
  })
  @Post('transfer-callback')
  public async processTransferCallback(
    @AnyValidBody() safaricomTransferCallback: SafaricomTransferCallbackDto, // We cannot control the structure of the callback data, so we use AnyValidBody
  ): Promise<void> {
    console.log(
      'POST fsps/safaricom/transfer-callback:',
      safaricomTransferCallback,
    );

    await this.safaricomReconciliationService.processTransferCallback(
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
  public async processTimeoutCallback(
    @AnyValidBody() // We cannot control the structure of the callback data, so we use AnyValidBody
    safaricomTimeoutCallback: any, // deliberatedly 'any', as we are unsure of the payload structure. This way we can console.log first and then validate.
  ): Promise<void> {
    console.log(
      'POST fsps/safaricom/timeout-callback:',
      safaricomTimeoutCallback,
    );

    // apply validation and error response according to current DTO structure
    const errors = await validate(
      plainToClass(SafaricomTimeoutCallbackDto, safaricomTimeoutCallback),
    );
    if (errors.length) {
      // Format the errors to match the default NestJS validation error response
      const errorMessages = errors.map((err) => ({
        property: err.property,
        constraints: err.constraints,
      }));
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        errors: errorMessages,
      });
    }

    await this.safaricomReconciliationService.processTimeoutCallback(
      safaricomTimeoutCallback,
    );
  }
}
