import { OnafriqCallbackResponseDto } from '@121-service/src/payments/fsp-integration/onafriq/dto/onafriq-callback-response.dto';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { Body, Controller, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('callbacks/onafriq')
// TODO: REFACTOR: rename to /callbacks/onafriq
@Controller('payments/onafriq')
export class OnafriqController {
  public constructor(private onafriqService: OnafriqService) {}

  @ApiOperation({
    summary:
      'Notification callback used by Onafriq to notify status of payment to us.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notified' })
  @Post('transaction')
  public async resultCallback(
    @Body() onafriqPaymentResultData: OnafriqCallbackResponseDto,
    @Req() request: Request,
  ): Promise<any> {
    console.log('Headers:', request.headers);
    console.log('Body:', onafriqPaymentResultData);
    console.log('Query:', request.query);
    console.log('Params:', request.params);
    await this.onafriqService.processOnafriqResult(onafriqPaymentResultData);
  }
}
