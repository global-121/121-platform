import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { MtnCreateTransferRequestDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-create-transfer-request.dto';
import { MtnTransferStatusResponseDto } from '@mock-service/src/fsp-integration/mtn/dto/mtn-transfer-status-response.dto';
import { MtnMockService } from '@mock-service/src/fsp-integration/mtn/mtn.mock.service';

@ApiTags('fsp/mtn')
@Controller('fsp/mtn')
export class MtnMockController {
  public constructor(private readonly mtnMockService: MtnMockService) {}

  @ApiOperation({ summary: 'Create a disbursement transfer (MTN MoMo API)' })
  @Post('disbursement/v1_0/transfer')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({
    name: 'X-Reference-Id',
    description: 'Unique reference ID (UUID) for the transfer.',
    required: true,
  })
  @ApiHeader({
    name: 'X-Target-Environment',
    description: 'Target environment, e.g. "sandbox" or "production".',
    required: true,
  })
  @ApiHeader({
    name: 'Ocp-Apim-Subscription-Key',
    description: 'MTN API subscription key.',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication.',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Transfer accepted for processing.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate reference ID.',
  })
  public createTransfer(
    @Body() body: MtnCreateTransferRequestDto,
    @Headers('x-reference-id') referenceId: string,
    @Headers('ocp-apim-subscription-key') subscriptionKey: string,
  ): void {
    const [status, responseBody] = this.mtnMockService.createTransfer({
      referenceId,
      subscriptionKey,
      body,
    });

    if (status !== HttpStatus.ACCEPTED) {
      throw new HttpException(responseBody ?? {}, status);
    }
  }

  @ApiOperation({
    summary: 'Get the status of a disbursement transfer (MTN MoMo API)',
  })
  @Get('disbursement/v1_0/transfer/:referenceId')
  @ApiParam({
    name: 'referenceId',
    description: 'The X-Reference-Id (UUID) used when creating the transfer.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiHeader({
    name: 'Ocp-Apim-Subscription-Key',
    description: 'MTN API subscription key.',
    required: true,
  })
  @ApiHeader({
    name: 'X-Target-Environment',
    description: 'Target environment, e.g. "sandbox" or "production".',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication.',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer status retrieved successfully.',
    type: MtnTransferStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transfer not found.',
  })
  public getTransferStatus(
    @Param('referenceId') referenceId: string,
    @Headers('ocp-apim-subscription-key') subscriptionKey: string,
  ): MtnTransferStatusResponseDto | object {
    const [status, responseBody] = this.mtnMockService.getTransferStatus({
      referenceId,
      subscriptionKey,
    });

    if (status !== HttpStatus.OK) {
      throw new HttpException(responseBody, status);
    }

    return responseBody;
  }
}
