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

import { AlFouadMockService } from '@mock-service/src/fsp-integration/al-fouad/al-fouad.mock.service';
import { AlFouadCreateTransactionRequestDto } from '@mock-service/src/fsp-integration/al-fouad/dto/al-fouad-create-transaction-request.dto';
import { AlFouadTransactionResponseDto } from '@mock-service/src/fsp-integration/al-fouad/dto/al-fouad-transaction-response.dto';

@ApiTags('fsp/al-fouad')
@Controller('fsp/al-fouad')
export class AlFouadMockController {
  public constructor(
    private readonly alFouadMockService: AlFouadMockService,
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
    @Body() body: AlFouadCreateTransactionRequestDto,
  ): AlFouadTransactionResponseDto {
    this.assertAuthorized(authorization);

    return this.alFouadMockService.createTransaction(body);
  }

  @ApiOperation({ summary: 'Get transaction by reference number' })
  @ApiQuery({ name: 'ReferenceNumber', required: true })
  @ApiHeader({ name: 'Authorization', required: true })
  @Get('api/Transaction/TransactionByRef')
  public getTransactionByRef(
    @Query('ReferenceNumber') referenceNumber: string,
    @Headers('authorization') authorization: string | undefined,
  ): AlFouadTransactionResponseDto {
    this.assertAuthorized(authorization);

    return this.alFouadMockService.getTransactionByRef(referenceNumber);
  }

  private assertAuthorized(authorization: string | undefined): void {
    if (!authorization?.startsWith('Bearer ')) {
      throw new HttpException(
        { message: 'Invalid or missing Authorization header.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
