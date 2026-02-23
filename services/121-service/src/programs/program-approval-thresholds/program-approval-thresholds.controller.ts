import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { UpdateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/update-program-approval-threshold.dto';
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
    summary: 'Create a program approval threshold',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Program approval threshold created successfully',
    type: GetProgramApprovalThresholdResponseDto,
  })
  @Post('programs/:programId/approval-thresholds')
  public async createProgramApprovalThreshold(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() createDto: CreateProgramApprovalThresholdDto,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    console.log('Creating program approval threshold with data:', {
      ...createDto,
      programId,
    });
    return await this.programApprovalThresholdsService.createProgramApprovalThreshold(
      {
        ...createDto,
        programId,
      },
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
    permissions: [PermissionEnum.ProgramREAD],
  })
  @ApiOperation({
    summary: 'Get a specific approval threshold by ID',
  })
  @ApiParam({ name: 'thresholdId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved approval threshold successfully',
    type: GetProgramApprovalThresholdResponseDto,
  })
  @Get('approval-thresholds/:thresholdId')
  public async getProgramApprovalThresholdById(
    @Param('thresholdId', ParseIntPipe) thresholdId: number,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    return await this.programApprovalThresholdsService.getProgramApprovalThresholdById(
      thresholdId,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramUPDATE],
  })
  @ApiOperation({
    summary: 'Update a program approval threshold',
  })
  @ApiParam({ name: 'thresholdId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Program approval threshold updated successfully',
    type: GetProgramApprovalThresholdResponseDto,
  })
  @Patch('approval-thresholds/:thresholdId')
  public async updateProgramApprovalThreshold(
    @Param('thresholdId', ParseIntPipe) thresholdId: number,
    @Body() updateDto: UpdateProgramApprovalThresholdDto,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    return await this.programApprovalThresholdsService.updateProgramApprovalThreshold(
      thresholdId,
      updateDto,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramUPDATE],
  })
  @ApiOperation({
    summary: 'Delete a program approval threshold',
  })
  @ApiParam({ name: 'thresholdId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Program approval threshold deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('approval-thresholds/:thresholdId')
  public async deleteProgramApprovalThreshold(
    @Param('thresholdId', ParseIntPipe) thresholdId: number,
  ): Promise<void> {
    return await this.programApprovalThresholdsService.deleteProgramApprovalThreshold(
      thresholdId,
    );
  }
}
