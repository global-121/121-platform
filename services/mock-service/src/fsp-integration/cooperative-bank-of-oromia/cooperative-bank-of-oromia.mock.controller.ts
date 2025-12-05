import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CooperativeBankOfOromiaMockService } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/cooperative-bank-of-oromia.mock.service';
import { CooperativeBankOfOromiaApiAccountValidationRequestBodyDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-account-validation-request-body.dto';
import { CooperativeBankOfOromiaApiAccountValidationResponseDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-account-validation-response.dto';
import { CooperativeBankOfOromiaAuthenticateResponseSuccessDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-request-body.mock.dto';
import { CooperativeBankOfOromiaApiTransferRequestBodyDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-request-body.dto';
import { CooperativeBankOfOromiaApiTransferResponseDto } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-response.dto';

@ApiTags('fsp/cooperative-bank-of-oromia')
@Controller('fsp/cooperative-bank-of-oromia')
export class CooperativeBankOfOromiaMockController {
  public constructor(
    private readonly mockService: CooperativeBankOfOromiaMockService,
  ) {}

  @ApiOperation({ summary: 'Disbursement' })
  @Post('nrc/1.0.0/transfer')
  @HttpCode(200)
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for API authentication',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Disbursement completed successfully',
    example: {
      success: true,
      message: 'Transaction completed',
      data: {
        transactionId: 'FT23137LWG57',
        messageId: 'DFHddDhgccffff5ngJHFA1',
        debitAccount: '1022200021158',
        creditAccount: '1022200081754',
        amountDebited: '10000000',
        amountCredited: '10000000',
        processingDate: '20230517',
      },
    },
  })
  public async transfer(
    @Headers() _headers: Record<string, string>,
    @Body() body: CooperativeBankOfOromiaApiTransferRequestBodyDto,
  ): Promise<CooperativeBankOfOromiaApiTransferResponseDto> {
    const response = await this.mockService.transfer({
      body,
    });
    if ('error' in response) {
      throw new BadRequestException(response);
    }
    return response;
  }

  @ApiOperation({ summary: 'Get Oauth2 access token' })
  @Post('oauth2/token')
  @HttpCode(200)
  public async getAccessToken(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown, // We are not using the body in the mock service
  ): Promise<CooperativeBankOfOromiaAuthenticateResponseSuccessDto> {
    const response = await this.mockService.getOauth2Token({
      headers,
      body,
    });
    if ('error' in response) {
      throw new BadRequestException(response);
    }
    return response;
  }

  @ApiOperation({ summary: 'Account validation' })
  @Post('nrc/1.0.0/accountValidation')
  @HttpCode(200)
  public async accountValidation(
    @Body() body: CooperativeBankOfOromiaApiAccountValidationRequestBodyDto,
  ): Promise<CooperativeBankOfOromiaApiAccountValidationResponseDto> {
    return await this.mockService.accountValidation({
      bankAccountNumber: body.accountNumber,
    });
  }
}
