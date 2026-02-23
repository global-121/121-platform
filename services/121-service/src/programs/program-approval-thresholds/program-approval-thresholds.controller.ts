import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/approval-thresholds')
@Controller()
export class ProgramApprovalThresholdsController {
  private readonly programApprovalThresholdsService: ProgramApprovalThresholdsService;

  public constructor(
    programApprovalThresholdsService: ProgramApprovalThresholdsService,
  ) {
    this.programApprovalThresholdsService = programApprovalThresholdsService;
  }

  @AuthenticatedUser()
  @ApiOperation({
    summary: 'Replace all approval thresholds for a program',
    description:
      'Replaces the entire threshold configuration. Deletes existing thresholds and creates new ones with their approvers.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Program approval thresholds replaced successfully',
    type: [GetProgramApprovalThresholdResponseDto],
  })
  @Post('programs/:programId/approval-thresholds')
  public async replaceProgramApprovalThresholds(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    return await this.programApprovalThresholdsService.replaceProgramApprovalThresholds(
      programId,
      thresholds,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramREAD],
  })
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

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramUPDATE],
  })
  @ApiOperation({
    summary: 'Delete all approval thresholds for a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'All program approval thresholds deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('programs/:programId/approval-thresholds')
  public async deleteAllProgramApprovalThresholds(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<void> {
    return await this.programApprovalThresholdsService.deleteAllProgramApprovalThresholds(
      programId,
    );
  }
}
