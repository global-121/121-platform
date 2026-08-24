import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AlfouadMockService } from '@mock-service/src/fsp-integration/alfouad/alfouad.mock.service';
import { AlfouadCreateTransactionRequestDto } from '@mock-service/src/fsp-integration/alfouad/dto/alfouad-create-transaction-request.dto';
import { AlfouadTransactionResponseDto } from '@mock-service/src/fsp-integration/alfouad/dto/alfouad-transaction-response.dto';

@ApiTags('fsp/alfouad')
@Controller('fsp/alfouad')
export class AlfouadMockController {
  public constructor(
    private readonly alfouadMockService: AlfouadMockService,
  ) {}

  @ApiOperation({ summary: 'Create transaction' })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'Bearer token with Base64-encoded Authentication XML',
  })
  @Post('api/Transaction/TransactionCreate')
  @HttpCode(HttpStatus.OK)
  public createTransaction(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: AlfouadCreateTransactionRequestDto,
  ): AlfouadTransactionResponseDto {
    this.assertAuthorized(authorization);

    return this.alfouadMockService.createTransaction(body);
  }

  @ApiOperation({ summary: 'Get transaction by reference number' })
  @ApiQuery({ name: 'ReferenceNumber', required: true })
  @ApiHeader({ name: 'Authorization', required: true })
  @Get('api/Transaction/TransactionByRef')
  public getTransactionByRef(
    @Query('ReferenceNumber') referenceNumber: string,
    @Headers('authorization') authorization: string | undefined,
  ): AlfouadTransactionResponseDto {
    this.assertAuthorized(authorization);

    return this.alfouadMockService.getTransactionByRef(referenceNumber);
  }

  private assertAuthorized(authorization: string | undefined): void {
    console.log('ALFOUAD DEBUG authorization header:', authorization);
    if (!authorization?.startsWith('Bearer ')) {
      throw new HttpException(
        { message: 'Invalid or missing Authorization header.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
