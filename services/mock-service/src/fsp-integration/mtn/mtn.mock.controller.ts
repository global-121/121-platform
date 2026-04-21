import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { MtnCreateTransferRequestDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-create-transfer-request.dto';
import { MtnMockService } from '@mock-service/src/fsp-integration/mtn/mtn.mock.service';

@ApiTags('fsp/mtn')
@Controller('fsp/mtn')
export class MtnMockController {
  public constructor(private readonly mtnMockService: MtnMockService) {}

  @ApiOperation({ summary: 'Get OAuth2 access token' })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'Basic auth credentials',
  })
  @ApiHeader({ name: 'Ocp-Apim-Subscription-Key', required: true })
  @Post('disbursement/token')
  @HttpCode(HttpStatus.OK)
  public authenticate(
    @Headers('authorization') authorization: string | undefined,
    @Headers('ocp-apim-subscription-key') subscriptionKey: string | undefined,
    @Res() res: Response,
  ): Response {
    const [status, responseBody] = this.mtnMockService.authenticate({
      authorization,
      subscriptionKey,
    });
    return res.status(status).json(responseBody);
  }

  @ApiOperation({ summary: 'Create disbursement transfer' })
  @ApiHeader({ name: 'X-Reference-Id', required: true })
  @ApiHeader({ name: 'Ocp-Apim-Subscription-Key', required: true })
  @Post('disbursement/v1_0/transfer')
  @HttpCode(HttpStatus.ACCEPTED)
  public createTransfer(
    @Headers('x-reference-id') referenceId: string | undefined,
    @Headers('ocp-apim-subscription-key') subscriptionKey: string | undefined,
    @Body() body: MtnCreateTransferRequestDto,
    @Res() res: Response,
  ): Response {
    const [status, responseBody] = this.mtnMockService.createTransfer({
      referenceId,
      subscriptionKey,
      body,
    });
    return responseBody
      ? res.status(status).json(responseBody)
      : res.status(status).send();
  }

  @ApiOperation({ summary: 'Get disbursement transfer status' })
  @ApiParam({ name: 'referenceId', required: true })
  @ApiHeader({ name: 'Ocp-Apim-Subscription-Key', required: true })
  @Get('disbursement/v1_0/transfer/:referenceId')
  public getTransferStatus(
    @Param('referenceId') referenceId: string,
    @Headers('ocp-apim-subscription-key') subscriptionKey: string | undefined,
    @Res() res: Response,
  ): Response {
    const [status, responseBody] = this.mtnMockService.getTransferStatus({
      referenceId,
      subscriptionKey,
    });
    return res.status(status).json(responseBody);
  }
}
