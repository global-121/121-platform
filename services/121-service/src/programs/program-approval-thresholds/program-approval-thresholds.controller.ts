import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/approval-thresholds')
@Controller()
export class ProgramApprovalThresholdsController {
  public constructor(
    private readonly programApprovalThresholdsService: ProgramApprovalThresholdsService,
  ) {}

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({
    summary: 'Replace all approval thresholds for a program',
    description:
      'Replaces the entire threshold configuration. Deletes existing thresholds and creates new ones with their approvers.',
  })
  @ApiBody({ type: [CreateProgramApprovalThresholdDto] })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Program approval thresholds replaced successfully',
    type: [GetProgramApprovalThresholdResponseDto],
  })
  @HttpCode(HttpStatus.CREATED)
  @Put('programs/:programId/approval-thresholds')
  public async createOrReplaceProgramApprovalThresholds(
    @Param('programId', ParseIntPipe) programId: number,
    @Body(new ParseArrayPipe({ items: CreateProgramApprovalThresholdDto }))
    thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    return await this.programApprovalThresholdsService.createOrReplaceProgramApprovalThresholds(
      programId,
      thresholds,
    );
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({
    summary: 'Get all approval thresholds for a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved approval thresholds successfully',
    type: [GetProgramApprovalThresholdResponseDto],
  })
  @Get('programs/:programId/approval-thresholds')
  public async getProgramApprovalThresholds(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    return await this.programApprovalThresholdsService.getProgramApprovalThresholds(
      programId,
    );
  }
}
