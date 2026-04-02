import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateTransferDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/create-transfer.dto';
import { MtnTransferStatusResponse } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-transfer-status-response.interface';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/mtn')
@Controller()
export class MtnController {
  public constructor(private readonly mtnService: MtnService) {}

  @AuthenticatedUser({
    isAdmin: true,
  })
  @ApiOperation({
    summary: 'Create a disbursement transfer via the MTN MoMo API.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Transfer created successfully',
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('fsps/mtn/transfer')
  public async createTransfer(
    @Body() createTransferDto: CreateTransferDto,
  ): Promise<void> {
    await this.mtnService.createTransfer(createTransferDto);
  }

  @AuthenticatedUser({
    isAdmin: true,
  })
  @ApiOperation({
    summary: 'Get the status of a disbursement transfer via the MTN MoMo API.',
  })
  @ApiParam({
    name: 'referenceId',
    description: 'The X-Reference-Id (UUID) used when creating the transfer.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer status retrieved successfully',
  })
  @Get('fsps/mtn/transfer/:referenceId')
  public async getTransferStatus(
    @Param('referenceId') referenceId: string,
  ): Promise<MtnTransferStatusResponse> {
    return this.mtnService.getTransferStatus({ referenceId });
  }
}
