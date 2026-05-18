import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { MtnAuthenticateResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-authenticate-response.dto';
import { MtnCreateTransferRequestDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-create-transfer-request.dto';
import { MtnTransferStatusResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-transfer-status-response.dto';
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
  ): MtnAuthenticateResponseDto {
    return this.mtnMockService.authenticate({
      authorization,
      subscriptionKey,
    });
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
  ): void {
    this.mtnMockService.createTransfer({
      referenceId,
      subscriptionKey,
      body,
    });
  }

  @ApiOperation({ summary: 'Get disbursement transfer status' })
  @ApiParam({ name: 'referenceId', required: true })
  @ApiHeader({ name: 'Ocp-Apim-Subscription-Key', required: true })
  @Get('disbursement/v1_0/transfer/:referenceId')
  public getTransfer(
    @Param('referenceId') referenceId: string,
    @Headers('ocp-apim-subscription-key') subscriptionKey: string | undefined,
  ): MtnTransferStatusResponseDto {
    return this.mtnMockService.getTransfer({
      referenceId,
      subscriptionKey,
    });
  }
}
