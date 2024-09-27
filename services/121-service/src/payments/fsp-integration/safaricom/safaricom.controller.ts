import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

import { SafaricomTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-timeout-callback.dto';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
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
  @Post('transfer-callback')
  public async processTransferCallback(
    @Body() safaricomTransferCallback: SafaricomTransferCallbackDto,
  ): Promise<void> {
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
  public async processTimeoutCallback(
    @Body()
    safaricomTimeoutCallback: any, // deliberatedly 'any', as we are unsure of the payload structure. This way we can console.log first and then validate.
  ): Promise<void> {
    // console.log so we know what the actual payload looks like and can adjust the DTO accordingly
    console.log(
      'safaricomTimeoutCallback: ',
      JSON.stringify(safaricomTimeoutCallback, null, 2),
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

    await this.safaricomService.processTimeoutCallback(
      safaricomTimeoutCallback,
    );
  }
}
